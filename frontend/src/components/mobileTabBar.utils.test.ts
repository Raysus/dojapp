import { describe, expect, it } from 'vitest';
import { getTabsForRole, shouldHideTabBar } from '../components/mobileTabBar.utils';

describe('mobileTabBar.utils', () => {
  it('returns student tabs', () => {
    expect(getTabsForRole('STUDENT').map(tab => tab.label)).toEqual(['Inicio', 'Cuenta']);
  });

  it('returns professor tabs including attendance', () => {
    expect(getTabsForRole('PROFESSOR').map(tab => tab.label)).toEqual([
      'Dojos',
      'Asistencia',
      'Cuenta',
    ]);
  });

  it('hides tab bar on content detail routes', () => {
    expect(shouldHideTabBar('/dojos/abc/contents/123')).toBe(true);
    expect(shouldHideTabBar('/student')).toBe(false);
  });

  it('marks dojos tab active for selected dojo route', () => {
    const dojosTab = getTabsForRole('PROFESSOR')[0];
    expect(dojosTab.match?.('/professor/dojos/abc')).toBe(true);
    expect(dojosTab.match?.('/professor')).toBe(true);
  });

  it('marks attendance route active for nested dojo attendance', () => {
    const attendanceTab = getTabsForRole('PROFESSOR')[1];
    expect(attendanceTab.match?.('/dojos/abc/attendance')).toBe(true);
  });
});
