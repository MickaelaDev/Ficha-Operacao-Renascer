import { useState } from 'react';
import { NOTES_COLUMNS } from '../lib/rules.js';
import { useLeaving } from '../hooks/useLeaving.js';
import Panel from './Panel.jsx';

function NoteCard({ note, leaving, dragging, onUpdate, onMove, onRemove, onDragStart, onDragEnd }) {
  return (
    <article
      className={`note${leaving ? ' is-leaving' : ''}${dragging ? ' is-dragging' : ''}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', note.id);
        onDragStart(note.id);
      }}
      onDragEnd={onDragEnd}
    >
      <input
        className="input note__title"
        type="text"
        placeholder="Título"
        autoComplete="off"
        value={note.titulo}
        onChange={(event) => onUpdate(note.id, 'titulo', event.target.value)}
      />
      <textarea
        className="input note__text"
        placeholder="Detalhes"
        rows={4}
        value={note.texto}
        onChange={(event) => onUpdate(note.id, 'texto', event.target.value)}
      />

      <div className="note__foot">
        <select
          className="note__status"
          value={note.status}
          aria-label="Mover anotação"
          onChange={(event) => onMove(note.id, event.target.value)}
        >
          {NOTES_COLUMNS.map((column) => (
            <option key={column.key} value={column.key}>
              {column.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn--sm btn--ghost note__delete"
          onClick={() => onRemove(note.id)}
        >
          Apagar
        </button>
      </div>
    </article>
  );
}

export default function NotesPanel({ notas, onAdd, onUpdate, onMove, onRemove }) {
  const { leaving, leave } = useLeaving();
  const [draggingId, setDraggingId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const dropOn = (event, status) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') || draggingId;
    if (id) onMove(id, status);
    setDraggingId(null);
    setOverColumn(null);
  };

  return (
    <Panel
      title="Anotações Mentais"
      span={12}
      className="panel--notes"
      actions={
        <button type="button" className="btn btn--sm" onClick={() => onAdd('acontecimentos')}>
          + Nova Nota
        </button>
      }
    >
      <div className="notes">
        {NOTES_COLUMNS.map((column) => {
          const cards = notas.filter((note) => note.status === column.key);
          return (
            <div
              key={column.key}
              className="notes__col"
              data-over={overColumn === column.key || undefined}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (overColumn !== column.key) setOverColumn(column.key);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOverColumn(null);
              }}
              onDrop={(event) => dropOn(event, column.key)}
            >
              <h3 className="notes__title">{column.label}</h3>

              <div className="notes__stack">
                {cards.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    leaving={leaving.has(note.id)}
                    dragging={draggingId === note.id}
                    onUpdate={onUpdate}
                    onMove={onMove}
                    onRemove={(id) => leave(id, () => onRemove(id))}
                    onDragStart={setDraggingId}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverColumn(null);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
