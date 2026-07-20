import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../themes/ThemeContext';
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus';
import {
  changeMyPassword,
  getMyProfile,
  logoutOtherSessions,
  updateMyProfile,
  type UserProfile,
} from '../services/users.service';
import PageHeader from '../components/ui/PageHeader';
import LoadingCard from '../components/ui/LoadingCard';
import EmptyState from '../components/ui/EmptyState';
import { IconDojo, IconUser } from '../components/icons';
import { professorDojoPath } from '../platform/routes';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Profesor',
  STUDENT: 'Alumno',
  INSTRUCTOR: 'Instructor',
};

const dojoRoleLabels: Record<string, string> = {
  PROFESSOR: 'Profesor',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Alumno',
};

function apiErrorMessage(err: unknown, fallback: string): string {
  const network = getNetworkErrorMessage(err);
  if (network) return network;
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  return fallback;
}

export default function AccountPage() {
  const { user, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const me = await getMyProfile();
        if (!mounted) return;
        setProfile(me);
        setName(me.name);
        setEmail(me.email);
      } catch (e) {
        if (!mounted) return;
        setError(getNetworkErrorMessage(e) ?? 'No se pudo cargar el perfil.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await updateMyProfile({
        name: name.trim(),
        email: email.trim(),
      });
      login(result);
      setProfile(prev =>
        prev
          ? {
              ...prev,
              name: result.user.name,
              email: result.user.email,
            }
          : prev,
      );
      setSuccess('Perfil actualizado.');
    } catch (err: any) {
      setError(apiErrorMessage(err, 'No se pudo guardar el perfil.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Contraseña actualizada.');
    } catch (err: any) {
      setError(apiErrorMessage(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const onLogoutOthers = async () => {
    setRevokingSessions(true);
    setError(null);
    setSuccess(null);
    try {
      const tokens = await logoutOtherSessions();
      login(tokens);
      setSuccess('Se cerraron las demás sesiones. Esta sigue activa.');
    } catch (err: any) {
      setError(apiErrorMessage(err, 'No se pudieron cerrar las otras sesiones.'));
    } finally {
      setRevokingSessions(false);
    }
  };

  if (!user) return null;
  if (loading) return <LoadingCard message="Cargando cuenta…" />;

  if (!profile) {
    return (
      <div className="stack">
        <PageHeader title="Mi cuenta" subtitle="No se pudo cargar tu perfil." />
        {error ? <div className="alert error">{error}</div> : null}
        <button
          className="button"
          type="button"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="stack">
      <PageHeader
        title="Mi cuenta"
        subtitle="Edita tu nombre, correo, contraseña y preferencias."
        action={
          user.role === 'STUDENT' ? (
            <Link className="button secondary" to="/student">
              Ir a entrenamiento
            </Link>
          ) : undefined
        }
      />

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Perfil</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Rol: <strong>{roleLabels[profile.role] ?? profile.role}</strong>
          {' · '}Miembro desde {memberSince}
        </p>

        <form className="form" onSubmit={e => void onSaveProfile(e)}>
          <div className="formGrid">
            <label className="fieldLabel">
              Nombre completo
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                minLength={2}
                required
                autoComplete="name"
              />
            </label>
            <label className="fieldLabel">
              Correo electrónico
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Estos son tus datos de acceso. El grado y el dojo los asigna tu sensei.
          </p>
          <button className="button" type="submit" disabled={savingProfile} style={{ marginTop: 14 }}>
            {savingProfile ? 'Guardando…' : 'Guardar perfil'}
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Mis dojos</h2>
        {!profile.dojos.length ? (
          <EmptyState
            icon={<IconDojo />}
            title="Sin dojos"
            description="Cuando te asignen a un dojo, aparecerá aquí."
          />
        ) : (
          <ul className="content-list">
            {profile.dojos.map(d => (
              <li key={d.id}>
                {profile.role === 'PROFESSOR' &&
                (d.role === 'PROFESSOR' || d.role === 'INSTRUCTOR') ? (
                  <button
                    type="button"
                    className="listAction"
                    onClick={() => navigate(professorDojoPath(d.id))}
                  >
                    <span aria-hidden="true">
                      <IconDojo />
                    </span>{' '}
                    {d.name}
                    <span className="content-listItemMeta" style={{ marginLeft: 8 }}>
                      {dojoRoleLabels[d.role] ?? d.role}
                      {d.grade ? ` · ${d.grade.name}` : ''}
                    </span>
                  </button>
                ) : profile.role === 'STUDENT' ? (
                  <button
                    type="button"
                    className="listAction"
                    onClick={() => navigate('/student')}
                  >
                    <span aria-hidden="true">
                      <IconDojo />
                    </span>{' '}
                    {d.name}
                    <span className="content-listItemMeta" style={{ marginLeft: 8 }}>
                      {dojoRoleLabels[d.role] ?? d.role}
                      {d.grade ? ` · ${d.grade.name}` : ' · Sin grado'}
                    </span>
                  </button>
                ) : (
                  <div className="listAction" style={{ cursor: 'default' }}>
                    <span aria-hidden="true">
                      <IconDojo />
                    </span>{' '}
                    {d.name}
                    <span className="content-listItemMeta" style={{ marginLeft: 8 }}>
                      {dojoRoleLabels[d.role] ?? d.role}
                      {d.grade ? ` · ${d.grade.name}` : ''}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Seguridad</h2>
        <form className="form" onSubmit={e => void onChangePassword(e)}>
          <div className="formGrid">
            <label className="fieldLabel">
              Contraseña actual
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="current-password"
              />
            </label>
            <label className="fieldLabel">
              Nueva contraseña
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
              />
            </label>
            <label className="fieldLabel">
              Confirmar nueva contraseña
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                autoComplete="new-password"
              />
            </label>
          </div>
          <button
            className="button"
            type="submit"
            disabled={savingPassword}
            style={{ marginTop: 14 }}
          >
            {savingPassword ? 'Actualizando…' : 'Cambiar contraseña'}
          </button>
        </form>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 8, gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Otras sesiones</div>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Cierra la sesión en otros dispositivos y mantiene esta.
            </p>
          </div>
          <button
            className="button secondary"
            type="button"
            disabled={revokingSessions}
            onClick={() => void onLogoutOthers()}
          >
            {revokingSessions ? 'Cerrando…' : 'Cerrar otras sesiones'}
          </button>
        </div>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Preferencias</h2>
        <div>
          <div className="muted" style={{ marginBottom: 8 }}>
            Tema de la interfaz
          </div>
          <div className="actionBar" role="group" aria-label="Tema">
            <button
              className={`button ${theme === 'light' ? '' : 'ghost'}`}
              type="button"
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
            >
              Claro
            </button>
            <button
              className={`button ${theme === 'dark' ? '' : 'ghost'}`}
              type="button"
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
            >
              Oscuro
            </button>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>Sesión</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          <IconUser /> {profile?.email ?? user.email}
        </p>
        <button className="button secondary" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
        <Link className="link" to="/privacy">
          Política de privacidad
        </Link>
      </section>
    </div>
  );
}
