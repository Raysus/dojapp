import { Outlet } from 'react-router-dom';
import MobileTabBar from './MobileTabBar';
import NetworkBanner from './NetworkBanner';

export default function MobileLayout() {
  return (
    <div className="mobileShell">
      <NetworkBanner />
      <main className="mobileMain">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
}