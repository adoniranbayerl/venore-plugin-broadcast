# Agent de diagnóstico do Broadcast Studio (Fase 13) — roda no PC de CADA TV, reportando CPU/RAM/
# GPU/uptime/rede pro servidor, pra aparecer em /admin/broadcast/diagnostics ao lado da saúde do
# vídeo (fonte "browser") e do processo Next.js (fonte "server"). Sem esse agent instalado, a tela
# de diagnóstico mostra "Agent não instalado nesta tela" pra essa TV — nunca bloqueia nada, é
# puramente informativo.
#
# CONFIGURAÇÃO — os 4 valores abaixo (entre __duplo-sublinhado__) são preenchidos automaticamente
# quando este arquivo é baixado pela rota /api/broadcast/output/:token/diagnostics/agent-script
# (link "Baixar script" na própria tela de diagnóstico, por saída) — nada pra editar à mão nesse
# caminho. Baixando o arquivo cru do repositório (git clone) em vez da rota, edite os 4 valores
# você mesmo antes de rodar.
$ServerUrl = "__SERVER_URL__"       # origem do servidor (a mesma que a TV usa pra abrir /ext/broadcast/out/...)
$OutputToken = "__OUTPUT_TOKEN__"   # token da URL desta TV (/ext/broadcast/out/<token>)
$AgentKey = "__AGENT_KEY__"         # chave atual gerada em /admin/broadcast/diagnostics -> "Chave do agent"
$StationLabel = "__STATION_LABEL__" # nome livre, só pra identificar a estação na tela de diagnóstico
$IntervalSeconds = 30

# GPU é best-effort: WMI não expõe % de uso de iGPU de forma confiável em todo hardware Windows —
# reportamos nome/driver, não uma métrica de carga garantida (ver contracts/types.ts,
# BroadcastAgentDiagnosticsSnapshot).
function Get-DiagnosticsSnapshot {
    $cpuLoad = $null
    try {
        $cpuLoad = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
    } catch {}

    $ramUsedPercent = $null
    $ramTotalMb = $null
    try {
        $os = Get-CimInstance Win32_OperatingSystem
        $ramTotalMb = [math]::Round($os.TotalVisibleMemorySize / 1024)
        $ramFreeMb = [math]::Round($os.FreePhysicalMemory / 1024)
        if ($ramTotalMb -gt 0) {
            $ramUsedPercent = [math]::Round((1 - ($ramFreeMb / $ramTotalMb)) * 100, 1)
        }
    } catch {}

    $gpuName = $null
    try {
        $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1
        if ($gpu) { $gpuName = $gpu.Name }
    } catch {}

    $uptimeSeconds = $null
    try {
        $lastBoot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
        $uptimeSeconds = [math]::Round(((Get-Date) - $lastBoot).TotalSeconds)
    } catch {}

    $localIp = $null
    try {
        $localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" } | Select-Object -First 1).IPAddress
    } catch {}

    $serverReachable = $null
    $serverLatencyMs = $null
    try {
        $uri = [System.Uri]$ServerUrl
        $test = Test-NetConnection -ComputerName $uri.Host -Port $(if ($uri.Port -gt 0) { $uri.Port } else { 80 }) -WarningAction SilentlyContinue
        $serverReachable = $test.TcpTestSucceeded
        if ($test.PingReplyDetails) { $serverLatencyMs = $test.PingReplyDetails.RoundTripTime }
    } catch {
        $serverReachable = $false
    }

    return @{
        cpuLoadPercent   = $cpuLoad
        ramUsedPercent   = $ramUsedPercent
        ramTotalMb       = $ramTotalMb
        gpuName          = $gpuName
        uptimeSeconds    = $uptimeSeconds
        localIp          = $localIp
        serverReachable  = $serverReachable
        serverLatencyMs  = $serverLatencyMs
    }
}

function Send-DiagnosticsReport {
    $snapshot = Get-DiagnosticsSnapshot
    $body = @{ stationLabel = $StationLabel; snapshot = $snapshot } | ConvertTo-Json -Depth 5
    $uri = "$ServerUrl/api/broadcast/output/$OutputToken/diagnostics/agent"

    try {
        Invoke-RestMethod -Method Post -Uri $uri -Headers @{ "X-Diagnostics-Key" = $AgentKey } -Body $body -ContentType "application/json" -TimeoutSec 10 | Out-Null
    } catch {
        Write-Host "[broadcast-diag-agent] falha ao reportar: $($_.Exception.Message)"
    }
}

# Loop infinito — uma falha isolada de amostra/POST nunca mata o processo, só pula pra próxima
# rodada. Registre isto no Agendador de Tarefas do Windows como "ao fazer logon" (Task Scheduler ->
# Create Task -> Triggers: At log on -> Actions: Start a program ->
# powershell.exe -ExecutionPolicy Bypass -File "C:\caminho\broadcast-diag-agent.ps1"), pra reiniciar
# sozinho se o PC reiniciar ou o script for encerrado.
while ($true) {
    try {
        Send-DiagnosticsReport
    } catch {
        Write-Host "[broadcast-diag-agent] erro inesperado: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds $IntervalSeconds
}
