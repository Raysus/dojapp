import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function NetworkBanner() {
  const online = useNetworkStatus();

  if (online) return null;

  return (
    <div className="networkBanner" role="status">
      Sin conexión — algunos datos pueden no estar disponibles.
    </div>
  );
}
