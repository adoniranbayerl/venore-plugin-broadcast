"use client";

import { Fragment, type CSSProperties, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type PointerSensorOptions,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// Tags/marcadores que continuam clicáveis normalmente mesmo com o card inteiro arrastável —
// pedido explícito: "quero poder clicar em qualquer lugar do card para drag n drop", mas
// editar/apagar/expandir/campos de formulário não podem virar início de arrasto por engano.
const DND_IGNORED_TAGS = new Set(["button", "a", "input", "select", "textarea"]);

function isInteractiveTarget(target: EventTarget | null): boolean {
  let element = target as HTMLElement | null;
  while (element) {
    if (element.dataset?.dndIgnore !== undefined) return true;
    if (element.tagName && DND_IGNORED_TAGS.has(element.tagName.toLowerCase())) return true;
    if (element.getAttribute?.("role") === "menuitem") return true;
    element = element.parentElement;
  }
  return false;
}

// Mesma checagem de base do PointerSensor padrão do dnd-kit (só botão primário do mouse/dedo
// único) + a exceção acima pra controle interativo — sem essa extensão o card inteiro sendo
// arrastável tornaria impossível clicar em qualquer botão/campo dentro dele.
class CardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
        if (!event.isPrimary || event.button !== 0) return false;
        if (isInteractiveTarget(event.target)) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

// Lista arrastável genérica — pedido explícito: "coloca drag n drop para alterar a ordem dos
// itens". Reaproveitada por PlaylistItemRow (itens de uma playlist) e AgendaCard (lista de
// agendas): quem chama só entrega os ids na ordem atual + como renderizar cada linha; a nova ordem
// completa volta via onReorder, que decide como persistir — mesmo padrão de "reenviar a lista
// inteira" que os antigos botões mover pra cima/baixo já usavam (reorderPlaylistItemsAction/
// reorderAgendasAction), só troca COMO a nova ordem é calculada, não o mecanismo de salvar.
// KeyboardSensor dá reordenação via teclado de graça (Space pra pegar, setas pra mover, Space de
// novo pra soltar) — suporte que um drag-and-drop só de mouse não teria.
export type SortableRowRenderProps = {
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  // Espalhe no elemento que deve virar a superfície de arrasto (o card inteiro, ou só o cabeçalho
  // dele quando o resto tem conteúdo expandido com muitos controles — ver AgendaCard). Contém
  // role/tabIndex/aria-* (foco e leitor de tela) + onPointerDown/onKeyDown (o gatilho de verdade).
  dragRootProps: HTMLAttributes<HTMLElement>;
  // Ícone decorativo (sem listener próprio — já coberto por dragRootProps) só como indicação
  // visual de que aquele card pode ser arrastado; "mantenha o handler" — o ícone continua ali.
  dragHandle: ReactNode;
  isDragging: boolean;
};

function SortableRow({ id, children }: { id: string; children: (props: SortableRowRenderProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const dragRootProps: HTMLAttributes<HTMLElement> = { ...attributes, ...(listeners as HTMLAttributes<HTMLElement>) };

  const dragHandle = (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </span>
  );

  return <>{children({ setNodeRef, style, dragRootProps, dragHandle, isDragging })}</>;
}

const NOOP_RENDER_PROPS: SortableRowRenderProps = { setNodeRef: () => {}, style: {}, dragRootProps: {}, dragHandle: null, isDragging: false };

export function SortableList({
  ids,
  onReorder,
  disabled = false,
  children,
}: {
  ids: string[];
  onReorder: (nextIds: string[]) => void;
  // Sem permissão de reordenar (ex: item de playlist pra quem não é responsável) — mesma lista,
  // sem alça de arrastar nenhuma, só o children normal.
  disabled?: boolean;
  children: (id: string, props: SortableRowRenderProps) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(CardPointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (disabled) {
    return (
      <>
        {ids.map((id) => (
          <Fragment key={id}>{children(id, NOOP_RENDER_PROPS)}</Fragment>
        ))}
      </>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {ids.map((id) => (
          <SortableRow key={id} id={id}>
            {(props) => children(id, props)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}
