import { useTheme } from '../themes/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const nextLabel = theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro';

    return (
        <button
            className="button secondary"
            type="button"
            onClick={toggleTheme}
            aria-label={nextLabel}
            aria-pressed={theme === 'dark'}
        >
            {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
        </button>
    );
}
