import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isNativeApp } from '../platform/native';
import { getTabsForRole, shouldHideTabBar } from './mobileTabBar.utils';

export default function MobileTabBar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!isNativeApp() || !user || shouldHideTabBar(location.pathname)) {
    return null;
  }

  const tabs = getTabsForRole(user.role);

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
            {tab.icon}
          </span>
          <span className="mobileTabLabel">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
