import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DiceChip } from './DiceChip.jsx';

const TRAY_ID = 'dice-tray';
const INIT_TIMEOUT_MS = 15000;
const FALLBACK_DELAY_MS = 700;

function notationFor(request) {
  const notation = ['1d20'];
  if (request.attrValue > 0) notation.push(`${request.attrValue}d4`);
  return notation;
}

function groupSides(group) {
  const digits = String(group?.sides ?? '').replace(/\D/g, '');
  const sides = Number(digits);
  return Number.isFinite(sides) ? sides : NaN;
}

function fallbackResult(request) {
  const d20 = 1 + Math.floor(Math.random() * 20);
  const d4s = Array.from({ length: request.attrValue }, () => 1 + Math.floor(Math.random() * 4));
  const d4Total = d4s.reduce((sum, value) => sum + value, 0);
  return {
    ...request,
    d20,
    d4s,
    d4Total,
    total: d20 + d4Total + request.skillValue,
    at: Date.now(),
    engine: 'fallback',
  };
}

function readResult(results, request) {
  const list = Array.isArray(results) ? results : [];
  const flat = list.every((item) => !Array.isArray(item?.rolls));

  let d20;
  let d4s = [];

  if (flat) {
    /* `roll()` resolve com um array de dados individuais. */
    d20 = Number(list.find((die) => groupSides(die) === 20)?.value);
    d4s = list
      .filter((die) => groupSides(die) === 4)
      .map((die) => Number(die.value))
      .filter((value) => Number.isFinite(value));
  } else {
    /* `getRollResults()` / `onRollComplete` usam grupos. */
    const d20Group = list.find((group) => groupSides(group) === 20);
    d20 = Number(d20Group?.rolls?.[0]?.value);
    d4s = list
      .filter((group) => groupSides(group) === 4)
      .flatMap((group) => (group.rolls ?? []).map((die) => Number(die.value)))
      .filter((value) => Number.isFinite(value));
  }

  if (!Number.isFinite(d20)) return fallbackResult(request);

  const d4Total = d4s.reduce((sum, value) => sum + value, 0);

  return {
    ...request,
    d20,
    d4s,
    d4Total,
    total: d20 + d4Total + request.skillValue,
    at: Date.now(),
    engine: '3d',
  };
}

/** Caminho dos assets funciona tanto na raiz quanto em subpasta do GitHub Pages. */
function assetConfig() {
  const base = new URL(import.meta.env.BASE_URL, window.location.href);
  if (base.protocol === 'file:') {
    return { origin: '', assetPath: `${base.href}dice/` };
  }
  return { origin: base.origin, assetPath: `${base.pathname}dice/` };
}

export default function DiceOverlay({ open, request, onClose, onResult, onReroll }) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [outcome, setOutcome] = useState(null);

  const boxRef = useRef(null);
  const initStarted = useRef(false);
  const aliveRef = useRef(true);
  const tokenRef = useRef(0);
  const closeRef = useRef(null);
  const rootRef = useRef(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  /* Só encerra a instância em um desmonte real (o StrictMode simula um). */
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* Carrega a mesa 3D apenas na primeira abertura. */
  useEffect(() => {
    if (!mounted || initStarted.current) return;
    initStarted.current = true;

    (async () => {
      try {
        const { default: DiceBox } = await import('@3d-dice/dice-box');
        if (!aliveRef.current) return;

        const { origin, assetPath } = assetConfig();
        const compact = window.matchMedia('(max-width: 760px)').matches;
        const box = new DiceBox({
          container: `#${TRAY_ID}`,
          assetPath,
          origin,
          theme: 'default',
          scale: compact ? 5 : 7,
          delay: 8,
          offscreen: true,
          enableShadows: true,
          lightIntensity: 1,
        });

        await Promise.race([
          box.init(),
          new Promise((_, reject) => {
            window.setTimeout(
              () => reject(new Error('Tempo esgotado ao preparar a mesa.')),
              INIT_TIMEOUT_MS,
            );
          }),
        ]);

        if (!aliveRef.current) return;
        boxRef.current = box;
        setReady(true);
      } catch (error) {
        console.error(error);
        if (!aliveRef.current) return;
        setFailed(true);
        setReady(true);
      }
    })();
  }, [mounted]);

  /* Rola sempre que uma nova requisição chega com a mesa aberta. */
  useEffect(() => {
    if (!open || !ready || !request) return undefined;

    const token = tokenRef.current + 1;
    tokenRef.current = token;
    let cancelled = false;
    setPhase('rolling');
    setOutcome(null);

    (async () => {
      let entry;
      try {
        if (boxRef.current) {
          const results = await boxRef.current.roll(notationFor(request));
          if (cancelled || token !== tokenRef.current) return;
          entry = readResult(results, request);
        } else {
          await new Promise((resolve) => {
            window.setTimeout(resolve, FALLBACK_DELAY_MS);
          });
          if (cancelled || token !== tokenRef.current) return;
          entry = fallbackResult(request);
        }
      } catch (error) {
        console.error(error);
        if (cancelled || token !== tokenRef.current) return;
        entry = fallbackResult(request);
      }

      if (!entry || cancelled || token !== tokenRef.current) return;
      setOutcome(entry);
      setPhase('done');
      onResultRef.current(entry);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, ready, request]);

  const handleClose = useCallback(() => {
    tokenRef.current += 1;
    if (boxRef.current) {
      try {
        boxRef.current.clear();
      } catch (error) {
        console.error(error);
      }
    }
    setPhase('idle');
    setOutcome(null);
    onClose();
  }, [onClose]);

  /* Esc, bloqueio de rolagem da página e foco inicial. */
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = rootRef.current?.querySelectorAll('button:not([disabled])');
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, handleClose]);

  if (!mounted) return null;

  const showResult = phase === 'done' && Boolean(outcome);
  const showFallbackNote = showResult && outcome.engine !== '3d';

  return createPortal(
    <div
      ref={rootRef}
      className="dice-overlay"
      data-open={open ? 'true' : undefined}
      aria-hidden={open ? undefined : 'true'}
      role="dialog"
      aria-modal="true"
      aria-label="Mesa de dados"
    >
      <div className="dice-overlay__stage">
        <div id={TRAY_ID} className="dice-tray" />
      </div>
      <div className="dice-overlay__vignette" aria-hidden="true" />

      <div className="dice-overlay__top">
        <div className="dice-overlay__meta">
          <span className="dice-overlay__eyebrow">Rolagem de Dados</span>
          <h2 className="dice-overlay__title">
            {request ? `${request.attrLabel} · ${request.skillLabel}` : 'Mesa de dados'}
          </h2>
          {request ? (
            <div className="dice-overlay__notation">
              <span>d20</span>
              {request.attrValue > 0 ? (
                <>
                  <i>+</i>
                  <span>{request.attrValue}d4</span>
                </>
              ) : null}
              <i>+</i>
              <span>per {request.skillValue}</span>
            </div>
          ) : null}
        </div>

        <button
          ref={closeRef}
          type="button"
          className="dice-overlay__close"
          onClick={handleClose}
          aria-label="Fechar mesa de dados"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="dice-overlay__hud">
        <div className="dice-overlay__readout" aria-live="polite" aria-atomic="true">
          {showResult ? (
            <>
              <span className="dice-overlay__label">Resultado</span>
              <div className="dice-overlay__formula">
                <DiceChip label="d20" value={outcome.d20} />
                <span className="op">+</span>
                <DiceChip
                  label={`${outcome.attrValue}d4`}
                  value={outcome.d4Total}
                  detail={outcome.d4s.length > 0 ? outcome.d4s.join(' + ') : '—'}
                />
                <span className="op">+</span>
                <DiceChip label="per" value={outcome.skillValue} />
              </div>
              {showFallbackNote ? (
                <span className="dice-overlay__note">
                  Mesa 3D indisponível — resultado gerado sem animação.
                </span>
              ) : null}
            </>
          ) : (
            <>
              <span className="dice-overlay__label">{phase === 'rolling' ? 'Rolando' : 'Mesa'}</span>
              <span className="dice-overlay__note">
                {phase === 'rolling'
                  ? 'Os dados estão rolando…'
                  : failed
                    ? 'Mesa 3D indisponível — o resultado será gerado sem animação.'
                    : 'Preparando a mesa…'}
              </span>
            </>
          )}
        </div>

        <div
          className="dice-overlay__score"
          data-visible={showResult ? 'true' : undefined}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="dice-overlay__score-label">Total</span>
          <strong className="dice-overlay__score-value">{showResult ? outcome.total : '—'}</strong>
        </div>

        <div className="dice-overlay__actions">
          <button type="button" className="btn" onClick={onReroll} disabled={phase === 'rolling'}>
            Rolar de novo
          </button>
          <button type="button" className="btn dice-overlay__dismiss" onClick={handleClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
