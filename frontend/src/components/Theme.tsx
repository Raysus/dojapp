import { useTheme } from '../themes/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button className="button secondary" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Modo oscuro' : '☀️ Modo claro'}
        </button>
    );
}
