// Regras puras do sistema: nada aqui toca no DOM nem no localStorage.

export const ATTRIBUTE_MAX = 5;

export const ATTRIBUTES = [
  { key: 'forca', label: 'Força', short: 'FOR' },
  { key: 'agilidade', label: 'Agilidade', short: 'AGI' },
  { key: 'intelecto', label: 'Intelecto', short: 'INT' },
  { key: 'percepcao', label: 'Percepção', short: 'PER' },
  { key: 'vontade', label: 'Vontade', short: 'VON' },
];

export const SKILLS = [
  { key: 'per_atletismo', label: 'Atletismo' },
  { key: 'per_furtividade', label: 'Furtividade' },
  { key: 'per_manipulacao', label: 'Manipulação' },
  { key: 'per_intimidacao', label: 'Intimidação' },
  { key: 'per_luta', label: 'Luta' },
  { key: 'per_mira', label: 'Mira' },
  { key: 'per_pilotagem', label: 'Pilotagem' },
  { key: 'per_investigacao', label: 'Investigação' },
  { key: 'per_tecnologia', label: 'Tecnologia' },
  { key: 'per_medicina', label: 'Medicina' },
  { key: 'per_ocultismo', label: 'Ocultismo' },
  { key: 'per_reflexo', label: 'Reflexo' },
];

export const VITALS = [
  { key: 'vida', label: 'Vida', tone: 'vida', inverted: false },
  { key: 'sanidade', label: 'Sanidade', tone: 'sanidade', inverted: false },
  { key: 'animo', label: 'Ânimo', tone: 'animo', inverted: false },
  { key: 'cont', label: 'Contaminação', tone: 'cont', inverted: true },
];

export const NOTES_COLUMNS = [
  { key: 'acontecimentos', label: 'Acontecimentos' },
  { key: 'importantes', label: 'Importantes' },
  { key: 'resolvidos', label: 'Resolvidos' },
];

export const NOTES_LABELS = NOTES_COLUMNS.reduce((map, col) => {
  map[col.key] = col.label;
  return map;
}, {});

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function toInt(value, fallback = 0) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Derivados exatamente como na ficha original:
 *   vida  = 20 + Força*3 + Vontade
 *   san   = 20 + Intelecto*3 + Vontade
 *   ânimo = Vontade*2 + Sanidade
 *   defesa = (Força + Vontade) * 3
 *   contaminação = Vontade * 5
 */
export function derive(sheet) {
  const f = toInt(sheet.forca);
  const i = toInt(sheet.intelecto);
  const v = toInt(sheet.vontade);

  const vidaMax = 20 + f * 3 + v;
  const sanidadeMax = 20 + i * 3 + v;
  const animoMax = v * 2 + sanidadeMax;
  const defesa = (f + v) * 3;
  const contMax = v * 5;

  return {
    defesa,
    vida: { max: vidaMax, current: clamp(toInt(sheet.vidaAtual), 0, vidaMax) },
    sanidade: { max: sanidadeMax, current: clamp(toInt(sheet.sanidadeAtual), 0, sanidadeMax) },
    animo: { max: animoMax, current: clamp(toInt(sheet.animoAtual), 0, animoMax) },
    cont: { max: contMax, current: clamp(toInt(sheet.contAtual), 0, contMax) },
  };
}

/** Nível de urgência da barra. Contaminação é invertida (quanto maior, pior). */
export function vitalLevel(current, max, inverted) {
  if (max <= 0) return 'idle';
  const pct = (current / max) * 100;
  const effective = inverted ? 100 - pct : pct;
  if (effective <= 10) return 'collapse';
  if (effective <= 30) return 'critical';
  if (effective <= 50) return 'danger';
  if (effective <= 70) return 'warn';
  return 'ok';
}
