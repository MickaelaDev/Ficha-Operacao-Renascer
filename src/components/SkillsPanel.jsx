import { SKILLS } from '../lib/rules.js';
import Field, { NumberInput } from './Field.jsx';
import Panel from './Panel.jsx';

export default function SkillsPanel({ sheet, onChange }) {
  return (
    <Panel title="Perícias Treinadas" span={8}>
      <div className="skills">
        {SKILLS.map((skill) => (
          <Field key={skill.key} label={skill.label}>
            <NumberInput
              className="input input--num"
              value={sheet[skill.key]}
              onChange={(value) => onChange(skill.key, value)}
              aria-label={skill.label}
            />
          </Field>
        ))}
      </div>
    </Panel>
  );
}
