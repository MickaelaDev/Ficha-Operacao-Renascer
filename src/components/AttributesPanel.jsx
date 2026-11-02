import { ATTRIBUTES, ATTRIBUTE_MAX } from '../lib/rules.js';
import Panel from './Panel.jsx';

export default function AttributesPanel({ sheet, onChange }) {
  return (
    <Panel title="Atributos Base" span={4}>
      <div className="attrs">
        {ATTRIBUTES.map((attribute) => {
          const value = sheet[attribute.key];
          return (
            <div className="attr" key={attribute.key}>
              <span className="attr__label">{attribute.label}</span>

              <div
                className="attr__pips"
                role="group"
                aria-label={`${attribute.label}: ${value} de ${ATTRIBUTE_MAX}`}
              >
                {Array.from({ length: ATTRIBUTE_MAX }, (_, index) => index + 1).map((step) => (
                  <button
                    key={step}
                    type="button"
                    className="pip"
                    data-on={step <= value || undefined}
                    aria-label={`Definir ${attribute.label} em ${step}`}
                    aria-pressed={step <= value}
                    title={`${attribute.label} ${step}`}
                    onClick={() => onChange(attribute.key, value === step ? step - 1 : step)}
                  />
                ))}
              </div>

              <span className="attr__value">{value}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
