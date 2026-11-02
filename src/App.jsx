import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Atmosphere from './components/Atmosphere.jsx';
import AttributesPanel from './components/AttributesPanel.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import DicePanel from './components/DicePanel.jsx';
import IdentityPanel from './components/IdentityPanel.jsx';
import InventoryPanel from './components/InventoryPanel.jsx';
import Masthead from './components/Masthead.jsx';
import NotesPanel from './components/NotesPanel.jsx';
import RitualsPanel from './components/RitualsPanel.jsx';
import ScrollTop from './components/ScrollTop.jsx';
import SkillsPanel from './components/SkillsPanel.jsx';
import Toasts from './components/Toasts.jsx';
import VitalsPanel from './components/VitalsPanel.jsx';
import { useToasts } from './hooks/useToasts.js';
import { derive } from './lib/rules.js';
import {
  clearStoredSheet,
  createEmptySheet,
  getSavedAt,
  getStoredBackup,
  isLegacyStoredSheet,
  isStoredSheetCorrupt,
  loadStoredSheet,
  markStorageVersion,
  normalizeSheet,
  saveSheet,
  serializeSheet,
  sheetReducer,
  slugify,
  snapshotStoredSheet,
} from './lib/sheet.js';

const initSheet = () => loadStoredSheet() ?? createEmptySheet();

function downloadJson(text, filename) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [sheet, dispatch] = useReducer(sheetReducer, null, initSheet);
  const [savedAt, setSavedAt] = useState(() => getSavedAt());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [storageNotice, setStorageNotice] = useState(null);

  const { toasts, push, dismiss } = useToasts();
  const derived = useMemo(() => derive(sheet), [sheet]);

  /* Compatibilidade: ficha salva pelo site antigo é carregada e ganha backup cru. */
  useEffect(() => {
    const corrupt = isStoredSheetCorrupt();
    const legacy = isLegacyStoredSheet();
    const raw = snapshotStoredSheet();
    if (corrupt) setStorageNotice('corrupt');
    else if (legacy && raw) setStorageNotice('legacy');
    markStorageVersion();
  }, []);

  const sheetRef = useRef(sheet);
  const dirty = useRef(false);
  useEffect(() => {
    sheetRef.current = sheet;
  }, [sheet]);

  const persist = useCallback(
    (next) => {
      try {
        saveSheet(next);
        dirty.current = false;
        setSavedAt(new Date());
        return true;
      } catch (error) {
        console.error(error);
        push('Não foi possível salvar no navegador.', 'error');
        return false;
      }
    },
    [push],
  );

  /* Autosave com debounce. */
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return undefined;
    }
    dirty.current = true;
    const timer = window.setTimeout(() => persist(sheet), 450);
    return () => window.clearTimeout(timer);
  }, [sheet, persist]);

  /* Garante que nada se perca ao fechar a aba. */
  useEffect(() => {
    const flush = () => {
      if (!dirty.current) return;
      try {
        saveSheet(sheetRef.current);
        dirty.current = false;
      } catch {
        /* storage indisponível — ignore */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const saveNow = useCallback(() => {
    if (persist(sheetRef.current)) push('Ficha salva.', 'success');
  }, [persist, push]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveNow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveNow]);

  const loadFromStorage = () => {
    const stored = loadStoredSheet();
    if (!stored) {
      push('Nenhuma ficha salva encontrada.', 'error');
      return;
    }
    dispatch({ type: 'sheet/load', sheet: stored });
    push('Ficha carregada.', 'success');
  };

  const exportSheet = () => {
    try {
      downloadJson(
        JSON.stringify(serializeSheet(sheet), null, 2),
        `ficha_${slugify(sheet.nome) || 'agente'}.json`,
      );
      push('Ficha exportada.', 'success');
    } catch (error) {
      console.error(error);
      push('Não foi possível exportar a ficha.', 'error');
    }
  };

  const downloadLegacyBackup = () => {
    const raw = getStoredBackup();
    if (!raw) {
      push('Nenhum backup antigo encontrado.', 'error');
      return;
    }
    try {
      downloadJson(raw, 'fichaOR-backup.json');
      push('Backup baixado.', 'success');
    } catch (error) {
      console.error(error);
      push('Não foi possível baixar o backup.', 'error');
    }
  };

  const importSheet = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const next = normalizeSheet(data);
      dispatch({ type: 'sheet/load', sheet: next });
      persist(next);
      push('Ficha importada com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      push('Arquivo inválido ou corrompido.', 'error');
    }
  };

  const confirmClear = () => {
    setClearing(true);
    window.setTimeout(() => {
      clearStoredSheet();
      dispatch({ type: 'sheet/reset' });
      setSavedAt(null);
      setClearing(false);
      setConfirmOpen(false);
      push('Ficha apagada.', 'success');
    }, 420);
  };

  /* Handlers estáveis — evitam re-render dos cards memoizados. */
  const setField = useCallback((key, value) => dispatch({ type: 'field', key, value }), []);
  const setVital = useCallback(
    (vitalKey, value) => dispatch({ type: 'vital', key: `${vitalKey}Atual`, value }),
    [],
  );

  const addRitual = useCallback(() => dispatch({ type: 'ritual/add' }), []);
  const updateRitual = useCallback(
    (id, key, value) => dispatch({ type: 'ritual/update', id, key, value }),
    [],
  );
  const removeRitual = useCallback((id) => dispatch({ type: 'ritual/remove', id }), []);

  const addItem = useCallback((tipo) => dispatch({ type: 'item/add', tipo }), []);
  const updateItem = useCallback(
    (id, key, value) => dispatch({ type: 'item/update', id, key, value }),
    [],
  );
  const removeItem = useCallback((id) => dispatch({ type: 'item/remove', id }), []);

  const addNote = useCallback((status) => dispatch({ type: 'note/add', status }), []);
  const updateNote = useCallback(
    (id, key, value) => dispatch({ type: 'note/update', id, key, value }),
    [],
  );
  const moveNote = useCallback((id, status) => dispatch({ type: 'note/move', id, status }), []);
  const removeNote = useCallback((id) => dispatch({ type: 'note/remove', id }), []);

  return (
    <>
      <Atmosphere />

      <div className="app">
        <Masthead
          savedAt={savedAt}
          onSave={saveNow}
          onLoad={loadFromStorage}
          onExport={exportSheet}
          onImport={importSheet}
          onClear={() => setConfirmOpen(true)}
        />

        {storageNotice ? (
          <div
            className={`legacy${storageNotice === 'corrupt' ? ' legacy--corrupt' : ''}`}
            role="status"
          >
            <span className="legacy__mark" aria-hidden="true">
              ◈
            </span>
            <div className="legacy__text">
              {storageNotice === 'corrupt' ? (
                <>
                  <strong>Não foi possível ler a ficha salva.</strong> O conteúdo original foi
                  preservado em um backup de segurança neste navegador.
                  <span className="legacy__hint">
                    Baixe o backup para guardar o arquivo antes de continuar preenchendo a ficha.
                  </span>
                </>
              ) : (
                <>
                  <strong>Ficha da versão anterior detectada.</strong> Seus dados foram carregados
                  e um backup de segurança foi salvo neste navegador.
                  <span className="legacy__hint">
                    Se você usava a ficha em outro endereço, use “Importar” para trazer o JSON
                    exportado.
                  </span>
                </>
              )}
            </div>
            <div className="legacy__actions">
              <button type="button" className="btn btn--sm" onClick={downloadLegacyBackup}>
                Baixar backup
              </button>
              <button
                type="button"
                className="legacy__close"
                onClick={() => setStorageNotice(null)}
                aria-label="Fechar aviso"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          </div>
        ) : null}

        <main className={`board${clearing ? ' is-clearing' : ''}`}>
          <IdentityPanel sheet={sheet} onChange={setField} />
          <AttributesPanel sheet={sheet} onChange={setField} />
          <SkillsPanel sheet={sheet} onChange={setField} />
          <VitalsPanel derived={derived} onSetVital={setVital} />
          <DicePanel sheet={sheet} />
          <InventoryPanel
            items={sheet.itens}
            onAdd={addItem}
            onUpdate={updateItem}
            onRemove={removeItem}
          />
          <RitualsPanel
            rituais={sheet.rituais}
            onAdd={addRitual}
            onUpdate={updateRitual}
            onRemove={removeRitual}
          />
          <NotesPanel
            notas={sheet.notas}
            onAdd={addNote}
            onUpdate={updateNote}
            onMove={moveNote}
            onRemove={removeNote}
          />
        </main>
      </div>

      <ScrollTop />
      <Toasts toasts={toasts} onDismiss={dismiss} />
      <ConfirmDialog
        open={confirmOpen}
        title="Limpar ficha"
        message="Deseja apagar todos os dados do sistema?"
        confirmLabel="Apagar tudo"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmClear}
      />
    </>
  );
}
