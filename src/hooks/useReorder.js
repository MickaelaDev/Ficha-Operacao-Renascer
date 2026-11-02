import { useCallback, useRef, useState } from 'react';

/**
 * Reordenação por drag & drop para os cards de itens e rituais.
 * A alça chama onDragStart(event, id); o card de destino chama
 * onDragOver/onDrop com o próprio id.
 */
export function useReorder(onMove) {
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);
  const draggingRef = useRef(null);

  const onDragStart = useCallback((event, id) => {
    if (!event.dataTransfer) return;
    draggingRef.current = id;
    setDraggingId(id);
    setOverId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);

    const card = event.currentTarget.closest('.card');
    if (card) event.dataTransfer.setDragImage(card, 28, 28);
  }, []);

  const onDragOver = useCallback((event, id) => {
    if (!draggingRef.current || draggingRef.current === id) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    setOverId(id);
  }, []);

  const onDrop = useCallback(
    (event, id) => {
      event.preventDefault();
      const source = event.dataTransfer?.getData('text/plain') || draggingRef.current;
      if (source && source !== id) onMove(source, { targetId: id });
      draggingRef.current = null;
      setDraggingId(null);
      setOverId(null);
    },
    [onMove],
  );

  const onDragEnd = useCallback(() => {
    draggingRef.current = null;
    setDraggingId(null);
    setOverId(null);
  }, []);

  const onDragLeaveContainer = useCallback((event) => {
    const related = event.relatedTarget;
    if (!(related instanceof Node) || !event.currentTarget.contains(related)) {
      setOverId(null);
    }
  }, []);

  return {
    draggingId,
    overId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDragLeaveContainer,
  };
}
