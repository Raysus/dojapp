export type TabItem = {
  to: string;
  label: string;
  icon: 'home' | 'user' | 'dojo' | 'check' | 'settings';
  match?: (pathname: string) => boolean;
};

const hideTabBarPatterns = [
  /^\/dojos\/[^/]+\/contents\/[^/]+$/,
  /^\/dojos\/[^/]+\/students\/[^/]+$/,
  /^\/dojos\/[^/]+\/stats$/,
];

export function shouldHideTabBar(pathname: string): boolean {
  return hideTabBarPatterns.some(pattern => pattern.test(pathname));
}

export function getTabsForRole(role: string): TabItem[] {
  if (role === 'STUDENT') {
    return [
      { to: '/student', label: 'Inicio', icon: 'home' },
      { to: '/account', label: 'Cuenta', icon: 'user' },
    ];
  }

  if (role === 'PROFESSOR') {
    return [
      { to: '/professor', label: 'Dojos', icon: 'dojo' },
      {
        to: '/professor/attendance',
        label: 'Asistencia',
        icon: 'check',
        match: pathname =>
          pathname === '/professor/attendance' ||
          /^\/dojos\/[^/]+\/attendance$/.test(pathname),
      },
      { to: '/account', label: 'Cuenta', icon: 'user' },
    ];
  }

  if (role === 'ADMIN') {
    return [
      { to: '/admin', label: 'Admin', icon: 'settings' },
      { to: '/account', label: 'Cuenta', icon: 'user' },
    ];
  }

  return [];
}
