type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'default' | 'success' | 'warning';
};

export default function StatCard({ label, value, hint, accent = 'default' }: StatCardProps) {
  return (
    <div className={`statCard statCard--${accent}`}>
      <div className="statCardLabel">{label}</div>
      <div className="statCardValue">{value}</div>
      {hint ? <div className="statCardHint">{hint}</div> : null}
    </div>
  );
}
