import { memo } from 'react';
import { useLeaving } from '../hooks/useLeaving.js';
import { useReorder } from '../hooks/useReorder.js';
import CardOrderControls from './CardOrderControls.jsx';
import Field from './Field.jsx';
import Panel from './Panel.jsx';

const RitualCard = memo(function RitualCard({
  ritual,
  leaving,
  dragging,
  over,
  canUp,
  canDown,
  onUpdate,
  onRemove,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const bind = (key) => ({
    value: ritual[key],
    onChange: (event) => onUpdate(ritual.id, key, event.target.value),
  });

  return (
    <article
      className={`card${leaving ? ' is-leaving' : ''}${dragging ? ' is-dragging' : ''}`}
      draggable={!leaving}
      data-kind="ritual"
      data-over={over || undefined}
      onDragStart={(event) => onDragStart(event, ritual.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, ritual.id)}
      onDrop={(event) => onDrop(event, ritual.id)}
    >
      <button
        type="button"
        className="card__close"
        onClick={() => onRemove(ritual.id)}
        title="Apagar Ritual"
        aria-label="Remover"
      >
        ✕
      </button>

      <div className="grid-2">
        <Field label="Nome">
          <input className="input" type="text" autoComplete="off" {...bind('nome')} />
        </Field>
        <Field label="Gasto">
          <input className="input" type="text" autoComplete="off" {...bind('gasto')} />
        </Field>
      </div>

      <Field label="Efeito">
        <textarea className="input" rows={3} {...bind('detalhes')} />
      </Field>

      <Field label="Riscos">
        <textarea className="input" rows={2} {...bind('riscos')} />
      </Field>

      <CardOrderControls
        id={ritual.id}
        label="ritual"
        canUp={canUp}
        canDown={canDown}
        disabled={leaving}
        onMove={onMove}
      />
    </article>
  );
});

export default function RitualsPanel({ rituais, onAdd, onUpdate, onRemove, onMove }) {
  const { leaving, leave } = useLeaving();
  const {
    draggingId,
    overId,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDragLeaveContainer,
  } = useReorder(onMove);

  return (
    <Panel
      title="Rituais & Poderes"
      span={12}
      className="panel--rituals"
      actions={
        <button type="button" className="btn btn--sm" onClick={onAdd}>
          + Novo Ritual
        </button>
      }
    >
      <div className="cards" onDragLeave={onDragLeaveContainer}>
        {rituais.map((ritual, index) => (
          <RitualCard
            key={ritual.id}
            ritual={ritual}
            leaving={leaving.has(ritual.id)}
            dragging={draggingId === ritual.id}
            over={overId === ritual.id}
            canUp={index > 0}
            canDown={index < rituais.length - 1}
            onUpdate={onUpdate}
            onRemove={(id) => leave(id, () => onRemove(id))}
            onMove={onMove}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </Panel>
  );
}
