import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileLayout from './MobileLayout';
import MobileTabBar from './MobileTabBar';
import NetworkBanner from './NetworkBanner';
import { isNativeApp } from '../platform/native';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Layout() {
  useDocumentTitle();

  if (isNativeApp()) {
    return <MobileLayout />;
  }

  return (
    <div className="appShell appShell--web">
      <NetworkBanner />
      <Header />
      <main className="appMain">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
}
