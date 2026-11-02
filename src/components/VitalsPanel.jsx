import { VITALS, clamp, vitalLevel } from '../lib/rules.js';
import { NumberInput } from './Field.jsx';
import Panel from './Panel.jsx';

function Vital({ vital, current, max, onSet }) {
  const level = vitalLevel(current, max, vital.inverted);
  const pct = max > 0 ? clamp((current / max) * 100, 0, 100) : 0;
  const step = (event, direction) => {
    const amount = event.shiftKey ? 5 : 1;
    onSet(clamp(current + amount * direction, 0, max));
  };

  return (
    <div className="vital" data-tone={vital.tone} data-level={level}>
      <div className="vital__head">
        <span className="vital__label">{vital.label}</span>
        <span className="vital__read">
          <NumberInput
            className="input vital__input"
            value={current}
            max={max}
            onChange={onSet}
            aria-label={`${vital.label} atual`}
          />
          <span className="vital__max">/ {max}</span>
        </span>
      </div>

      <div className="bar" role="presentation">
        <span className="bar__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="vital__controls">
        <button
          type="button"
          className="btn btn--sm vital__step"
          onClick={(event) => step(event, -1)}
          title="−1 (Shift = −5)"
          aria-label={`Reduzir ${vital.label}`}
        >
          −
        </button>
        <button
          type="button"
          className="btn btn--sm vital__step"
          onClick={(event) => step(event, 1)}
          title="+1 (Shift = +5)"
          aria-label={`Aumentar ${vital.label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function VitalsPanel({ derived, onSetVital }) {
  return (
    <Panel title="Monitoramento Vital" span={6} className="panel--vitals">
      <div className="vitals">
        {VITALS.map((vital) => (
          <Vital
            key={vital.key}
            vital={vital}
            current={derived[vital.key].current}
            max={derived[vital.key].max}
            onSet={(value) => onSetVital(vital.key, value)}
          />
        ))}
      </div>

      <div className="defesa">
        <span className="defesa__label">Defesa</span>
        <strong className="defesa__value">{derived.defesa}</strong>
      </div>
    </Panel>
  );
}
