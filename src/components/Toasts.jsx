export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="toast"
          data-variant={toast.variant}
          onClick={() => onDismiss(toast.id)}
          title="Fechar"
        >
          <span className="toast__dot" aria-hidden="true" />
          <span className="toast__text">{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
