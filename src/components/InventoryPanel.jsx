import { memo } from 'react';
import { useLeaving } from '../hooks/useLeaving.js';
import { useReorder } from '../hooks/useReorder.js';
import CardOrderControls from './CardOrderControls.jsx';
import Field from './Field.jsx';
import Panel from './Panel.jsx';

const ItemCard = memo(function ItemCard({
  item,
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
    value: item[key],
    onChange: (event) => onUpdate(item.id, key, event.target.value),
  });
  const isWeapon = item.tipo === 'arma';
  const label = isWeapon ? 'arma' : 'item';

  return (
    <article
      className={`card${isWeapon ? ' card--arma' : ''}${leaving ? ' is-leaving' : ''}${
        dragging ? ' is-dragging' : ''
      }`}
      data-kind={item.tipo}
      data-over={over || undefined}
      onDragOver={(event) => onDragOver(event, item.id)}
      onDrop={(event) => onDrop(event, item.id)}
    >
      <button
        type="button"
        className="card__close"
        onClick={() => onRemove(item.id)}
        title={isWeapon ? 'Apagar Arma' : 'Apagar Item'}
        aria-label="Remover"
      >
        ✕
      </button>

      {isWeapon ? (
        <>
          <div className="grid-2">
            <Field label="Arma">
              <input className="input" type="text" autoComplete="off" {...bind('nome')} />
            </Field>
            <Field label="Munição">
              <input className="input" type="text" autoComplete="off" {...bind('municao')} />
            </Field>
          </div>
          <div className="grid-2">
            <Field label="Dano">
              <input className="input" type="text" autoComplete="off" {...bind('dano')} />
            </Field>
            <Field label="Alcance">
              <input className="input" type="text" autoComplete="off" {...bind('alcance')} />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea className="input" rows={2} {...bind('desc')} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Item">
            <input className="input" type="text" autoComplete="off" {...bind('nome')} />
          </Field>
          <Field label="Descrição">
            <textarea className="input" rows={3} {...bind('desc')} />
          </Field>
          <Field label="Uso">
            <input className="input" type="text" autoComplete="off" {...bind('uso')} />
          </Field>
        </>
      )}

      <CardOrderControls
        id={item.id}
        label={label}
        canUp={canUp}
        canDown={canDown}
        disabled={leaving}
        onMove={onMove}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </article>
  );
});

export default function InventoryPanel({ items, onAdd, onUpdate, onRemove, onMove }) {
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
      title="Equipamentos e Itens"
      span={12}
      actions={
        <>
          <button type="button" className="btn btn--sm" onClick={() => onAdd('comum')}>
            + Item
          </button>
          <button type="button" className="btn btn--sm" onClick={() => onAdd('arma')}>
            + Arma
          </button>
        </>
      }
    >
      <div className="cards" onDragLeave={onDragLeaveContainer}>
        {items.map((item, index) => (
          <ItemCard
            key={item.id}
            item={item}
            leaving={leaving.has(item.id)}
            dragging={draggingId === item.id}
            over={overId === item.id}
            canUp={index > 0}
            canDown={index < items.length - 1}
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
