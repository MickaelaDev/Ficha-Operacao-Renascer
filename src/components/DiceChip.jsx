export function DiceChip({ label, value, detail }) {
  return (
    <span className="chip">
      <em>{label}</em>
      <b>{value}</b>
      {detail ? <small>{detail}</small> : null}
    </span>
  );
}
