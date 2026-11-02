export default function CardOrderControls({
  id,
  label,
  canUp,
  canDown,
  disabled = false,
  onMove,
  onDragStart,
  onDragEnd,
}) {
  const move = (direction) => {
    if (disabled) return;
    onMove(id, { direction });
  };

  return (
    <div className="card__order" role="group" aria-label={`Reordenar ${label}`}>
      <button
        type="button"
        className="card__grip"
        draggable={!disabled}
        aria-disabled={disabled || undefined}
        onDragStart={(event) => onDragStart(event, id)}
        onDragEnd={onDragEnd}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          if (event.key === 'ArrowUp' && canUp) move('up');
          if (event.key === 'ArrowDown' && canDown) move('down');
        }}
        title="Arraste para reordenar (ou use ↑ ↓)"
        aria-label={`Arrastar ${label} para reordenar. Use as setas para cima e para baixo.`}
        aria-keyshortcuts="ArrowUp ArrowDown"
      >
        <span aria-hidden="true">⠿</span>
      </button>

      <button
        type="button"
        className="card__nudge"
        onClick={() => move('up')}
        disabled={disabled || !canUp}
        title="Mover para cima"
        aria-label={`Mover ${label} para cima`}
      >
        ↑
      </button>
      <button
        type="button"
        className="card__nudge"
        onClick={() => move('down')}
        disabled={disabled || !canDown}
        title="Mover para baixo"
        aria-label={`Mover ${label} para baixo`}
      >
        ↓
      </button>
    </div>
  );
}
