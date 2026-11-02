import {
  ATTRIBUTES,
  ATTRIBUTE_MAX,
  NOTES_LABELS,
  SKILLS,
  clamp,
  derive,
  toInt,
} from './rules.js';

export const STORAGE_KEY = 'fichaOR';
const SAVED_AT_KEY = 'fichaOR.salvoEm';
const BACKUP_KEY = 'fichaOR.backup.v1';
const VERSION_KEY = 'fichaOR.versao';
const STORAGE_VERSION = '2';

const ATTRIBUTE_KEYS = new Set(ATTRIBUTES.map((a) => a.key));
const SKILL_KEYS = new Set(SKILLS.map((s) => s.key));
const NOTE_STATUS = new Set(Object.keys(NOTES_LABELS));

/** Campos numéricos aceitos na importação/armazenamento. */
const NUMERIC_KEYS = new Set([
  'idade',
  ...ATTRIBUTE_KEYS,
  ...SKILL_KEYS,
  'vidaAtual',
  'sanidadeAtual',
  'animoAtual',
  'contAtual',
]);

const VITAL_KEY_BY_FIELD = {
  vidaAtual: 'vida',
  sanidadeAtual: 'sanidade',
  animoAtual: 'animo',
  contAtual: 'cont',
};

export function uid(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const asString = (value) => (value === undefined || value === null ? '' : String(value));

export function createEmptySheet() {
  const sheet = { nome: '', profissao: '', idade: 0 };
  ATTRIBUTES.forEach(({ key }) => {
    sheet[key] = 0;
  });
  SKILLS.forEach(({ key }) => {
    sheet[key] = 0;
  });
  sheet.vidaAtual = 0;
  sheet.sanidadeAtual = 0;
  sheet.animoAtual = 0;
  sheet.contAtual = 0;
  sheet.rituais = [];
  sheet.itens = [];
  sheet.notas = [];
  return sheet;
}

export function createRitual(data = {}) {
  return {
    id: data.id || uid('rit'),
    nome: asString(data.nome),
    gasto: asString(data.gasto),
    detalhes: asString(data.detalhes),
    riscos: asString(data.riscos),
  };
}

export function createItem(tipo = 'comum', data = {}) {
  const resolved = data.tipo === 'arma' || tipo === 'arma' ? 'arma' : 'comum';
  return {
    id: data.id || uid('item'),
    tipo: resolved,
    nome: asString(data.nome),
    desc: asString(data.desc),
    uso: asString(data.uso),
    municao: asString(data.municao),
    dano: asString(data.dano),
    alcance: asString(data.alcance),
  };
}

export function createNote(data = {}) {
  return {
    id: data.id || uid('nota'),
    status: NOTE_STATUS.has(data.status) ? data.status : 'acontecimentos',
    titulo: asString(data.titulo),
    texto: asString(data.texto),
  };
}

export function clampVitals(sheet) {
  const d = derive(sheet);
  return {
    ...sheet,
    vidaAtual: clamp(sheet.vidaAtual, 0, d.vida.max),
    sanidadeAtual: clamp(sheet.sanidadeAtual, 0, d.sanidade.max),
    animoAtual: clamp(sheet.animoAtual, 0, d.animo.max),
    contAtual: clamp(sheet.contAtual, 0, d.cont.max),
  };
}

/** Move um item para a posição `to` da lista original (sem perder o objeto). */
function moveToIndex(list, from, to) {
  if (from < 0 || from >= list.length) return list;
  const target = clamp(to, 0, list.length - 1);
  if (from === target) return list;

  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Aceita o JSON antigo (v1) e o novo sem perder nada. */
export function normalizeSheet(raw) {
  const base = createEmptySheet();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;

  const sheet = { ...base };

  Object.keys(base).forEach((key) => {
    if (key === 'rituais' || key === 'itens' || key === 'notas') return;
    if (raw[key] === undefined || raw[key] === null) return;

    if (NUMERIC_KEYS.has(key)) {
      let n = toInt(raw[key]);
      if (ATTRIBUTE_KEYS.has(key)) n = clamp(n, 0, ATTRIBUTE_MAX);
      else n = Math.max(0, n);
      sheet[key] = n;
    } else {
      sheet[key] = asString(raw[key]);
    }
  });

  sheet.rituais = Array.isArray(raw.rituais) ? raw.rituais.slice(0, 100).map(createRitual) : [];
  sheet.itens = Array.isArray(raw.itens)
    ? raw.itens.slice(0, 200).map((item) => createItem(item?.tipo, item ?? {}))
    : [];
  sheet.notas = Array.isArray(raw.notas) ? raw.notas.slice(0, 300).map(createNote) : [];

  return clampVitals(sheet);
}

/** Formato salvo/exportado. Mantém compatibilidade com a ficha antiga. */
export function serializeSheet(sheet) {
  const d = derive(sheet);
  const data = {
    nome: sheet.nome,
    profissao: sheet.profissao,
    idade: sheet.idade,
  };

  ATTRIBUTES.forEach(({ key }) => {
    data[key] = sheet[key];
  });
  SKILLS.forEach(({ key }) => {
    data[key] = sheet[key];
  });

  data.vidaAtual = sheet.vidaAtual;
  data.sanidadeAtual = sheet.sanidadeAtual;
  data.animoAtual = sheet.animoAtual;
  data.contAtual = sheet.contAtual;

  // Derivados também vão no arquivo para a ficha antiga continuar abrindo.
  data.vidaMax = d.vida.max;
  data.sanidadeMax = d.sanidade.max;
  data.animoMax = d.animo.max;
  data.contMax = d.cont.max;
  data.defesa = d.defesa;

  data.rituais = sheet.rituais.map(({ nome, gasto, detalhes, riscos }) => ({
    nome,
    gasto,
    detalhes,
    riscos,
  }));
  data.itens = sheet.itens.map(({ tipo, nome, desc, uso, municao, dano, alcance }) => ({
    tipo,
    nome,
    desc,
    uso,
    municao,
    dano,
    alcance,
  }));
  data.notas = sheet.notas.map(({ id, status, titulo, texto }) => ({ id, status, titulo, texto }));

  return data;
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function sheetReducer(state, action) {
  switch (action.type) {
    case 'field': {
      const { key, value } = action;
      let next = { ...state, [key]: value };

      if (ATTRIBUTE_KEYS.has(key)) {
        next[key] = clamp(toInt(value), 0, ATTRIBUTE_MAX);
        next = clampVitals(next);
      } else if (SKILL_KEYS.has(key) || key === 'idade') {
        next[key] = Math.max(0, toInt(value));
      }

      return next;
    }

    case 'vital': {
      const vitalKey = VITAL_KEY_BY_FIELD[action.key];
      if (!vitalKey) return state;
      const max = derive(state)[vitalKey].max;
      return { ...state, [action.key]: clamp(toInt(action.value), 0, max) };
    }

    case 'ritual/add':
      return { ...state, rituais: [...state.rituais, createRitual()] };

    case 'ritual/update':
      return {
        ...state,
        rituais: state.rituais.map((r) =>
          r.id === action.id ? { ...r, [action.key]: asString(action.value) } : r,
        ),
      };

    case 'ritual/remove':
      return { ...state, rituais: state.rituais.filter((r) => r.id !== action.id) };

    case 'ritual/move': {
      const from = state.rituais.findIndex((r) => r.id === action.id);
      if (from < 0) return state;

      let to;
      if (action.targetId) {
        to = state.rituais.findIndex((r) => r.id === action.targetId);
        if (to < 0) return state;
      } else if (action.direction === 'up' || action.direction === 'down') {
        to = from + (action.direction === 'down' ? 1 : -1);
      } else {
        return state;
      }

      const next = moveToIndex(state.rituais, from, to);
      return next === state.rituais ? state : { ...state, rituais: next };
    }

    case 'item/add':
      return { ...state, itens: [...state.itens, createItem(action.tipo)] };

    case 'item/update':
      return {
        ...state,
        itens: state.itens.map((i) =>
          i.id === action.id ? { ...i, [action.key]: asString(action.value) } : i,
        ),
      };

    case 'item/remove':
      return { ...state, itens: state.itens.filter((i) => i.id !== action.id) };

    case 'item/move': {
      const from = state.itens.findIndex((i) => i.id === action.id);
      if (from < 0) return state;

      let to;
      if (action.targetId) {
        to = state.itens.findIndex((i) => i.id === action.targetId);
        if (to < 0) return state;
      } else if (action.direction === 'up' || action.direction === 'down') {
        to = from + (action.direction === 'down' ? 1 : -1);
      } else {
        return state;
      }

      const next = moveToIndex(state.itens, from, to);
      return next === state.itens ? state : { ...state, itens: next };
    }

    case 'note/add':
      return { ...state, notas: [...state.notas, createNote({ status: action.status })] };

    case 'note/update':
      return {
        ...state,
        notas: state.notas.map((n) =>
          n.id === action.id ? { ...n, [action.key]: asString(action.value) } : n,
        ),
      };

    case 'note/move':
      if (!NOTE_STATUS.has(action.status)) return state;
      return {
        ...state,
        notas: state.notas.map((n) => (n.id === action.id ? { ...n, status: action.status } : n)),
      };

    case 'note/remove':
      return { ...state, notas: state.notas.filter((n) => n.id !== action.id) };

    case 'sheet/load':
      return normalizeSheet(action.sheet);

    case 'sheet/reset':
      return createEmptySheet();

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Persistência                                                        */
/* ------------------------------------------------------------------ */

export function saveSheet(sheet) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeSheet(sheet)));
  localStorage.setItem(SAVED_AT_KEY, String(Date.now()));
  localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
}

export function loadStoredSheet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeSheet(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Guarda uma cópia crua da ficha encontrada antes de qualquer gravação nova.
 * É o seguro contra qualquer diferença entre o formato antigo e o novo.
 */
export function snapshotStoredSheet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (!localStorage.getItem(BACKUP_KEY)) {
      localStorage.setItem(BACKUP_KEY, raw);
    }
    return raw;
  } catch {
    return null;
  }
}

/** Verdadeiro quando há ficha salva por uma versão anterior do site. */
export function isLegacyStoredSheet() {
  try {
    return (
      Boolean(localStorage.getItem(STORAGE_KEY)) &&
      localStorage.getItem(VERSION_KEY) !== STORAGE_VERSION
    );
  } catch {
    return false;
  }
}

/** O conteúdo salvo existe, mas não é um JSON válido. */
export function isStoredSheetCorrupt() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    JSON.parse(raw);
    return false;
  } catch {
    return true;
  }
}

export function markStorageVersion() {
  try {
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  } catch {
    /* storage indisponível — ignore */
  }
}

export function getStoredBackup() {
  try {
    return localStorage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
}

export function clearStoredSheet() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SAVED_AT_KEY);
  localStorage.removeItem(VERSION_KEY);
  localStorage.removeItem(BACKUP_KEY);
}

export function getSavedAt() {
  const raw = localStorage.getItem(SAVED_AT_KEY);
  const time = Number(raw);
  return Number.isFinite(time) && time > 0 ? new Date(time) : null;
}

export function slugify(text) {
  return asString(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40);
}
