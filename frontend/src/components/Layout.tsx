import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileLayout from './MobileLayout';
import NetworkBanner from './NetworkBanner';
import { isNativeApp } from '../platform/native';

export default function Layout() {
  if (isNativeApp()) {
    return <MobileLayout />;
  }

  return (
    <div className="appShell">
      <NetworkBanner />
      <Header />
      <main className="appMain">
        <Outlet />
      </main>
    </div>
  );
}
