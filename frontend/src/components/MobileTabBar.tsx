import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isNativeApp } from '../platform/native';
import { getTabsForRole, shouldHideTabBar } from './mobileTabBar.utils';
import { IconCheck, IconDojo, IconHome, IconSettings, IconUser } from './icons';

function useCompactNav() {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}

function TabIcon({ name }: { name: string }) {
  switch (name) {
    case 'home':
      return <IconHome />;
    case 'user':
      return <IconUser />;
    case 'dojo':
      return <IconDojo />;
    case 'check':
      return <IconCheck />;
    case 'settings':
      return <IconSettings />;
    default:
      return null;
  }
}

export default function MobileTabBar() {
  const { user } = useAuth();
  const location = useLocation();
  const compact = useCompactNav();
  const native = isNativeApp();

  const visible = (native || compact) && !!user && !shouldHideTabBar(location.pathname);

  if (!visible) return null;

  const tabs = getTabsForRole(user!.role);

  return (
    <nav className="mobileTabBar" aria-label="Navegación principal">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => {
            const active = tab.match ? tab.match(location.pathname) : isActive;
            return `mobileTab${active ? ' active' : ''}`;
          }}
        >
          <span className="mobileTabIcon" aria-hidden="true">
            <TabIcon name={tab.icon} />
          </span>
          <span className="mobileTabLabel">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
