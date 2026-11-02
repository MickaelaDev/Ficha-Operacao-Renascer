import Field, { NumberInput } from './Field.jsx';
import Panel from './Panel.jsx';

export default function IdentityPanel({ sheet, onChange }) {
  return (
    <Panel title="Identidade do Agente" span={12}>
      <div className="grid grid--identity">
        <Field label="Nome">
          <input
            className="input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={sheet.nome}
            onChange={(event) => onChange('nome', event.target.value)}
          />
        </Field>

        <Field label="Profissão">
          <input
            className="input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={sheet.profissao}
            onChange={(event) => onChange('profissao', event.target.value)}
          />
        </Field>

        <Field label="Idade">
          <NumberInput
            className="input"
            value={sheet.idade}
            onChange={(value) => onChange('idade', value)}
            aria-label="Idade"
          />
        </Field>
      </div>
    </Panel>
  );
}
