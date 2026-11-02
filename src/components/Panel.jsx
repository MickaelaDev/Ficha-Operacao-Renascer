export default function Panel({ title, span = 12, actions = null, className = '', children }) {
  return (
    <section className={`panel ${className}`.trim()} data-span={span}>
      <header className="panel__head">
        <h2 className="panel__title">{title}</h2>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
