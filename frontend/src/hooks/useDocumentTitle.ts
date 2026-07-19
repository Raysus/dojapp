import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Array<{ match: RegExp | string; title: string }> = [
  { match: '/privacy', title: 'Privacidad' },
  { match: '/login', title: 'Iniciar sesión' },
  { match: '/admin', title: 'Administración' },
  { match: '/professor/attendance', title: 'Asistencia' },
  { match: /^\/professor\/dojos\//, title: 'Dojo' },
  { match: '/professor', title: 'Panel del profesor' },
  { match: '/student', title: 'Panel del alumno' },
  { match: '/account', title: 'Cuenta' },
  { match: '/unauthorized', title: 'Sin permiso' },
  { match: /^\/dojos\/[^/]+\/attendance$/, title: 'Asistencia del dojo' },
  { match: /^\/dojos\/[^/]+\/stats$/, title: 'Estadísticas del dojo' },
  { match: /^\/dojos\/[^/]+\/students\//, title: 'Detalle de alumno' },
  { match: /^\/dojos\/[^/]+\/contents\//, title: 'Contenido' },
  { match: '/', title: 'Inicio' },
];

export function useDocumentTitle(appName = 'Dojapp') {
  const { pathname } = useLocation();

  useEffect(() => {
    const found = TITLES.find(item =>
      typeof item.match === 'string' ? item.match === pathname : item.match.test(pathname),
    );
    document.title = found ? `${found.title} · ${appName}` : appName;
  }, [pathname, appName]);
}
