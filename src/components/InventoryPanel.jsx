import { memo } from 'react';
import { useLeaving } from '../hooks/useLeaving.js';
import Field from './Field.jsx';
import Panel from './Panel.jsx';

const ItemCard = memo(function ItemCard({ item, leaving, onUpdate, onRemove }) {
  const bind = (key) => ({
    value: item[key],
    onChange: (event) => onUpdate(item.id, key, event.target.value),
  });
  const isWeapon = item.tipo === 'arma';

  return (
    <article
      className={`card${isWeapon ? ' card--arma' : ''}${leaving ? ' is-leaving' : ''}`}
      data-kind={item.tipo}
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
    </article>
  );
});

export default function InventoryPanel({ items, onAdd, onUpdate, onRemove }) {
  const { leaving, leave } = useLeaving();

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
      <div className="cards">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            leaving={leaving.has(item.id)}
            onUpdate={onUpdate}
            onRemove={(id) => leave(id, () => onRemove(id))}
          />
        ))}
      </div>
    </Panel>
  );
}
