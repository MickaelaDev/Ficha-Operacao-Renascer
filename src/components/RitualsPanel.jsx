import { memo } from 'react';
import { useLeaving } from '../hooks/useLeaving.js';
import Field from './Field.jsx';
import Panel from './Panel.jsx';

const RitualCard = memo(function RitualCard({ ritual, leaving, onUpdate, onRemove }) {
  const bind = (key) => ({
    value: ritual[key],
    onChange: (event) => onUpdate(ritual.id, key, event.target.value),
  });

  return (
    <article className={`card${leaving ? ' is-leaving' : ''}`} data-kind="ritual">
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
    </article>
  );
});

export default function RitualsPanel({ rituais, onAdd, onUpdate, onRemove }) {
  const { leaving, leave } = useLeaving();

  return (
    <Panel
      title="Rituais & Poderes"
      span={12}
      actions={
        <button type="button" className="btn btn--sm" onClick={onAdd}>
          + Novo Ritual
        </button>
      }
    >
      <div className="cards">
        {rituais.map((ritual) => (
          <RitualCard
            key={ritual.id}
            ritual={ritual}
            leaving={leaving.has(ritual.id)}
            onUpdate={onUpdate}
            onRemove={(id) => leave(id, () => onRemove(id))}
          />
        ))}
      </div>
    </Panel>
  );
}
