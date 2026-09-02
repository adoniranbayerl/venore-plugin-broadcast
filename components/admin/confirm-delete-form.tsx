"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { Button } from "@venore/plugin-sdk/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@venore/plugin-sdk/ui";
import { useActionToast } from "@venore/plugin-sdk/ui";
import type { BroadcastActionState } from "./actions";

const initialState: BroadcastActionState = { error: null };

// Confirmação via AlertDialog do próprio site em vez do confirm() nativo do navegador — pedido
// explícito: "a confirmação não deve ser pela confirmação nativa do navegador, abre uma caixa de
// diálogo". Mesmo padrão de DeleteMediaButton (admin/media/_components/delete-media-button.tsx):
// o botão só abre o diálogo; o form de verdade (escondido) só submete no clique de "Apagar" dentro
// do AlertDialog, via requestSubmit() — nunca no onSubmit do form em si.
export function ConfirmAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Apagar",
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Botão + diálogo já embutidos — pra quando o próprio botão-gatilho é um ícone isolado (o caso
// comum nas três seções: apagar tela/playlist/agenda/evento/item, remover PIN). Quando o gatilho
// já é outra coisa (ex: um item de DropdownMenu, ver PlaylistItemActionsMenu em
// playlists-section.tsx), use ConfirmAlertDialog direto, controlando "open" por fora.
export function ConfirmDeleteButton({
  action,
  fields,
  title,
  description,
  confirmLabel = "Apagar",
  successMessage,
  icon,
  label,
  variant = "destructive",
  className,
  onSuccess,
}: {
  action: (state: BroadcastActionState, formData: FormData) => Promise<BroadcastActionState>;
  fields: Record<string, string>;
  title: string;
  description: string;
  confirmLabel?: string;
  successMessage?: string;
  icon: ReactNode;
  label: string;
  variant?: "destructive" | "ghost";
  className?: string;
  // Chamado quando a action termina sem erro — usado por gatilhos que não recarregam a página
  // (ex: RemoveOutputPinButton, que atualiza o estado otimista do PIN em vez de revalidatePath).
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  useActionToast({ pending, error: state.error, successMessage, onSuccess });
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={formAction} className="hidden">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <Button
        type="button"
        variant={variant}
        size="icon"
        className={className}
        disabled={pending}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        {icon}
      </Button>
      <ConfirmAlertDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        pending={pending}
      />
    </>
  );
}
