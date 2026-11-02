import { useCallback, useRef, useState } from 'react';
import { ATTRIBUTES, ATTRIBUTE_MAX, SKILLS, clamp, toInt } from '../lib/rules.js';
import { uid } from '../lib/sheet.js';
import DiceOverlay from './DiceOverlay.jsx';
import { DiceChip } from './DiceChip.jsx';
import Icon from './Icon.jsx';
import Panel from './Panel.jsx';

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DicePanel({ sheet }) {
  const [attrKey, setAttrKey] = useState(ATTRIBUTES[0].key);
  const [skillKey, setSkillKey] = useState(SKILLS[0].key);
  const [request, setRequest] = useState(null);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const rollButtonRef = useRef(null);

  const attrValue = clamp(toInt(sheet[attrKey]), 0, ATTRIBUTE_MAX);
  const skillValue = Math.max(0, toInt(sheet[skillKey]));

  const buildRequest = useCallback(() => {
    const attribute = ATTRIBUTES.find((item) => item.key === attrKey) ?? ATTRIBUTES[0];
    const skill = SKILLS.find((item) => item.key === skillKey) ?? SKILLS[0];
    return {
      id: uid('roll'),
      attrKey,
      skillKey,
      attrValue: clamp(toInt(sheet[attrKey]), 0, ATTRIBUTE_MAX),
      skillValue: Math.max(0, toInt(sheet[skillKey])),
      attrLabel: attribute.label,
      skillLabel: skill.label,
    };
  }, [attrKey, skillKey, sheet]);

  const openRoll = () => {
    setRequest(buildRequest());
    setOpen(true);
  };

  const reroll = useCallback(() => {
    setRequest((current) => (current ? { ...current, id: uid('roll') } : buildRequest()));
  }, [buildRequest]);

  const closeOverlay = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => rollButtonRef.current?.focus(), 30);
  }, []);

  const handleResult = useCallback((entry) => {
    setResult(entry);
    setHistory((list) => [entry, ...list].slice(0, 8));
  }, []);

  return (
    <Panel title="Rolagem de Dados" span={6} className="panel--dice">
      <div className="dice">
        <div className="dice__config">
          <label className="field">
            <span className="field__label">Atributo Base</span>
            <select
              className="input"
              value={attrKey}
              onChange={(event) => setAttrKey(event.target.value)}
            >
              {ATTRIBUTES.map((attribute) => (
                <option key={attribute.key} value={attribute.key}>
                  {attribute.label}
                </option>
              ))}
            </select>
            <span className="field__hint">{attrValue}d4</span>
          </label>

          <label className="field">
            <span className="field__label">Perícia</span>
            <select
              className="input"
              value={skillKey}
              onChange={(event) => setSkillKey(event.target.value)}
            >
              {SKILLS.map((skill) => (
                <option key={skill.key} value={skill.key}>
                  {skill.label}
                </option>
              ))}
            </select>
            <span className="field__hint">+ {skillValue}</span>
          </label>
        </div>

        <div className={`dice__stage${result ? ' dice__stage--result' : ''}`}>
          {result ? (
            <>
              <div className="result__die" aria-hidden="true">
                <svg className="result__glyph" viewBox="0 0 100 100" focusable="false">
                  <polygon
                    className="result__glyph-outer"
                    points="50,5 89,27 89,73 50,95 11,73 11,27"
                  />
                  <polygon
                    className="result__glyph-inner"
                    points="50,22 74,36 74,64 50,78 26,64 26,36"
                  />
                  <path
                    className="result__glyph-lines"
                    d="M50 5v17M89 27 74 36M89 73 74 64M50 95V78M11 73l15-9M11 27l15 9"
                  />
                </svg>
                <b>{result.d20}</b>
              </div>

              <div className="dice__readout" aria-live="polite" aria-atomic="true">
                <span className="dice__combo">
                  {result.attrLabel} · {result.skillLabel}
                </span>
                <div className="dice__formula">
                  <DiceChip label="d20" value={result.d20} />
                  <span className="op">+</span>
                  <DiceChip
                    label={`${result.attrValue}d4`}
                    value={result.d4Total}
                    detail={result.d4s.length > 0 ? result.d4s.join(' + ') : '—'}
                  />
                  <span className="op">+</span>
                  <DiceChip label="per" value={result.skillValue} />
                  <span className="op op--eq">=</span>
                  <strong className="dice__total">{result.total}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="dice__readout">
              <span className="dice__status dice__status--idle">Nenhuma rolagem ainda.</span>
              <span className="dice__hint">Escolha o atributo e a perícia, depois role os dados.</span>
            </div>
          )}
        </div>

        <button
          ref={rollButtonRef}
          type="button"
          className="btn btn--primary btn--roll"
          onClick={openRoll}
          aria-haspopup="dialog"
        >
          <Icon name="dice" size={16} className="btn__icon" />
          Rolar Teste
        </button>

        <div className="rolls">
          <div className="rolls__head">
            <span className="rolls__title">Histórico</span>
            {history.length > 0 ? (
              <button type="button" className="link" onClick={() => setHistory([])}>
                Limpar
              </button>
            ) : null}
          </div>

          {history.length === 0 ? (
            <p className="rolls__empty">—</p>
          ) : (
            <ul className="rolls__list">
              {history.map((entry) => (
                <li className="roll" key={entry.id}>
                  <span className="roll__total">{entry.total}</span>
                  <span className="roll__combo">
                    {entry.attrLabel} · {entry.skillLabel}
                    <small>
                      d20 {entry.d20} · {entry.attrValue}d4 {entry.d4Total} · per {entry.skillValue}
                    </small>
                  </span>
                  <time className="roll__time">{formatClock(entry.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DiceOverlay
        open={open}
        request={request}
        onClose={closeOverlay}
        onResult={handleResult}
        onReroll={reroll}
      />
    </Panel>
  );
}
