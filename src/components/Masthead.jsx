import { useRef } from 'react';
import Icon from './Icon.jsx';

function formatTime(date) {
  if (!date) return null;
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function Masthead({ savedAt, onSave, onLoad, onExport, onImport, onClear }) {
  const fileRef = useRef(null);

  return (
    <header className="masthead">
      <div className="masthead__row">
        <div className="masthead__brand">
          <span className="title__mark" aria-hidden="true" />
          <h1 className="title">
            <span className="title__text" data-text="Operação Renascer">
              Operação Renascer
            </span>
          </h1>
        </div>

        <div className="masthead__side">
          <span className="sync" data-state={savedAt ? 'saved' : 'idle'}>
            <span className="sync__dot" aria-hidden="true" />
            {savedAt ? `salvo ${formatTime(savedAt)}` : 'sem alterações'}
          </span>

          <div className="actions">
            <button type="button" className="btn" onClick={onSave} title="Ctrl + S">
              <Icon name="save" className="btn__icon" />
              Salvar
            </button>
            <button type="button" className="btn" onClick={onLoad}>
              <Icon name="load" className="btn__icon" />
              Carregar
            </button>
            <button type="button" className="btn" onClick={onExport}>
              <Icon name="export" className="btn__icon" />
              Exportar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                onImport(file);
                event.target.value = '';
              }}
            />
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Icon name="import" className="btn__icon" />
              Importar
            </button>
            <button type="button" className="btn btn--danger" onClick={onClear}>
              <Icon name="trash" className="btn__icon" />
              Limpar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
