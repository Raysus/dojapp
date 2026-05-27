export default function LoadingCard({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div className="loadingCard card" role="status" aria-live="polite">
      <div className="loadingSpinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
