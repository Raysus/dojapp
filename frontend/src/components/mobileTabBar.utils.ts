export type TabItem = {
  to: string;
  label: string;
  icon: string;
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
      { to: '/student', label: 'Inicio', icon: '🏠' },
      { to: '/account', label: 'Cuenta', icon: '👤' },
    ];
  }

  if (role === 'PROFESSOR') {
    return [
      { to: '/professor', label: 'Dojos', icon: '🥋' },
      {
        to: '/professor/attendance',
        label: 'Asistencia',
        icon: '✅',
        match: pathname =>
          pathname === '/professor/attendance' ||
          /^\/dojos\/[^/]+\/attendance$/.test(pathname),
      },
      { to: '/account', label: 'Cuenta', icon: '👤' },
    ];
  }

  if (role === 'ADMIN') {
    return [
      { to: '/admin', label: 'Admin', icon: '⚙️' },
      { to: '/account', label: 'Cuenta', icon: '👤' },
    ];
  }

  return [];
}
