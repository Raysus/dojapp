import { useEffect, useMemo, useState } from 'react';
import {
  assignUserToDojo,
  createContent,
  createUser,
  getHealth,
  getStats,
  listDojos,
  listGrades,
  listUsers,
  type AdminDojo,
  type AdminGrade,
  type AdminStats,
  type AdminUser,
} from '../services/admin.service';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import LoadingCard from '../components/ui/LoadingCard';

type Tab = 'users' | 'content' | 'monitoring';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users');

  const [error, setError] = useState<string | null>(null);

  // monitoring
  const [health, setHealth] = useState<{ ok: boolean; timestamp: string; uptimeSeconds: number } | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'ADMIN' | 'PROFESSOR' | 'STUDENT',
  });

  // assign membership (admin)
  const [assignForm, setAssignForm] = useState({
    userId: '',
    dojoId: '',
    dojoRole: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR',
    gradeId: '',
  });
  const [assignGrades, setAssignGrades] = useState<AdminGrade[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // content
  const [dojos, setDojos] = useState<AdminDojo[]>([]);
  const [grades, setGrades] = useState<AdminGrade[]>([]);
  const [dojoId, setDojoId] = useState('');
  const [contentForm, setContentForm] = useState({
    title: '',
    type: 'TEXT' as 'PDF' | 'VIDEO' | 'TEXT' | 'LINK',
    url: '',
    body: '',
    gradeId: '',
  });
  const [contentLoading, setContentLoading] = useState(false);

  const selectedDojo = useMemo(() => dojos.find(d => d.id === dojoId) ?? null, [dojos, dojoId]);
  const selectedAssignDojo = useMemo(() => dojos.find(d => d.id === assignForm.dojoId) ?? null, [dojos, assignForm.dojoId]);

  async function refreshUsers() {
    setError(null);
    setUsersLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      if (!assignForm.userId && data.length) {
        setAssignForm(prev => ({ ...prev, userId: data[0].id }));
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar usuarios');
    } finally {
      setUsersLoading(false);
    }
  }

  async function refreshMonitoring() {
    setError(null);
    try {
      const [h, s] = await Promise.all([getHealth(), getStats()]);
      setHealth(h);
      setStats(s);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar monitoreo');
    }
  }

  async function loadDojos() {
    setError(null);
    try {
      const data = await listDojos();
      setDojos(data);

      if (!dojoId && data.length) setDojoId(data[0].id);
      if (!assignForm.dojoId && data.length) setAssignForm(prev => ({ ...prev, dojoId: data[0].id }));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar dojos');
    }
  }

  async function loadGrades(forDojoId: string) {
    if (!forDojoId) {
      setGrades([]);
      return;
    }
    setError(null);
    try {
      const data = await listGrades(forDojoId);
      setGrades(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar grados');
    }
  }

  async function loadAssignGrades(forDojoId: string) {
    if (!forDojoId) {
      setAssignGrades([]);
      return;
    }
    setError(null);
    try {
      const data = await listGrades(forDojoId);
      setAssignGrades(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar grados');
    }
  }

  useEffect(() => {
    refreshUsers();
    refreshMonitoring();
    loadDojos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadGrades(dojoId);
    setContentForm(prev => ({ ...prev, gradeId: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dojoId]);

  useEffect(() => {
    loadAssignGrades(assignForm.dojoId);
    setAssignForm(prev => ({ ...prev, gradeId: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignForm.dojoId]);

  async function onCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
      });

      setUserForm({ name: '', email: '', password: '', role: 'STUDENT' });
      await refreshUsers();
      await refreshMonitoring();
    } catch (e2: any) {
      setError(e2?.response?.data?.message ?? 'No se pudo crear usuario');
    }
  }

  async function onAssignUser(e: React.FormEvent) {
    e.preventDefault();
    if (!assignForm.userId || !assignForm.dojoId) return;

    setError(null);
    setAssignLoading(true);
    try {
      await assignUserToDojo(assignForm.userId, {
        dojoId: assignForm.dojoId,
        dojoRole: assignForm.dojoRole,
        gradeId: assignForm.gradeId || undefined,
      });

      await refreshUsers();
      await refreshMonitoring();
    } catch (e2: any) {
      setError(e2?.response?.data?.message ?? 'No se pudo asignar usuario al dojo');
    } finally {
      setAssignLoading(false);
    }
  }

  async function onCreateContent(e: React.FormEvent) {
    e.preventDefault();
    if (!dojoId) return;

    setError(null);
    setContentLoading(true);
    try {
      await createContent(dojoId, {
        title: contentForm.title.trim(),
        type: contentForm.type,
        url: contentForm.url.trim() || undefined,
        body: contentForm.body.trim() || undefined,
        gradeId: contentForm.gradeId || undefined,
      });

      setContentForm({ title: '', type: 'TEXT', url: '', body: '', gradeId: '' });
      await refreshMonitoring();
    } catch (e2: any) {
      setError(e2?.response?.data?.message ?? 'No se pudo crear contenido');
    } finally {
      setContentLoading(false);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Panel de administración"
        subtitle="Usuarios, contenido, monitoreo y estadísticas del sistema."
        action={
          <nav className="tabBar" aria-label="Secciones de admin">
            <button
              type="button"
              className={`tabButton ${tab === 'users' ? 'active' : ''}`}
              onClick={() => setTab('users')}
            >
              Usuarios
            </button>
            <button
              type="button"
              className={`tabButton ${tab === 'content' ? 'active' : ''}`}
              onClick={() => setTab('content')}
            >
              Contenido
            </button>
            <button
              type="button"
              className={`tabButton ${tab === 'monitoring' ? 'active' : ''}`}
              onClick={() => setTab('monitoring')}
            >
              Monitoreo
            </button>
          </nav>
        }
      />

      {error && (
        <div className="alert error">
          <b>Error:</b> {error}
        </div>
      )}

      {tab === 'users' && (
        <section className="stack">
          <div className="card">
            <h2>Crear usuario</h2>
            <form className="form" onSubmit={onCreateUser} style={{ marginTop: 14 }}>
              <div className="formGrid">
                <label className="fieldLabel">
                  Nombre
                  <input className="input" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                </label>

                <label className="fieldLabel">
                  Email
                  <input className="input" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                </label>

                <label className="fieldLabel">
                  Password
                  <input className="input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
                </label>

                <label className="fieldLabel">
                  Rol
                  <select className="input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as typeof userForm.role })}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="PROFESSOR">PROFESSOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
              </div>

              <div className="row" style={{ marginTop: 14 }}>
                <button className="button" type="submit">Crear</button>
                <button className="button secondary" type="button" onClick={refreshUsers} disabled={usersLoading}>
                  {usersLoading ? 'Actualizando…' : 'Refrescar usuarios'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2>Asignar usuario a un dojo</h2>
            <p className="muted" style={{ marginTop: 6 }}>Selecciona usuario, dojo, rol y grado (obligatorio para alumnos).</p>

            <form className="form" onSubmit={onAssignUser} style={{ marginTop: 14 }}>
              <div className="formGrid">
                <label className="fieldLabel">
                  Usuario
                  <select className="input" value={assignForm.userId} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fieldLabel">
                  Dojo
                  <select className="input" value={assignForm.dojoId} onChange={e => setAssignForm({ ...assignForm, dojoId: e.target.value })}>
                    {dojos.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fieldLabel">
                  Rol en dojo
                  <select className="input" value={assignForm.dojoRole} onChange={e => setAssignForm({ ...assignForm, dojoRole: e.target.value as typeof assignForm.dojoRole })}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="PROFESSOR">PROFESSOR</option>
                  </select>
                </label>

                <label className="fieldLabel">
                  Grado (solo si STUDENT)
                  <select
                    className="input"
                    value={assignForm.gradeId}
                    onChange={e => setAssignForm({ ...assignForm, gradeId: e.target.value })}
                    disabled={assignForm.dojoRole !== 'STUDENT'}
                  >
                    <option value="">(sin grado)</option>
                    {assignGrades.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.order}. {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="row" style={{ marginTop: 14 }}>
                <button className="button" type="submit" disabled={assignLoading}>
                  {assignLoading ? 'Asignando…' : 'Asignar'}
                </button>
                {selectedAssignDojo ? (
                  <span className="muted">Dojo seleccionado: {selectedAssignDojo.name}</span>
                ) : null}
              </div>
            </form>
          </div>

          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Usuarios</h2>
              <button className="button secondary" onClick={refreshUsers} disabled={usersLoading}>
                {usersLoading ? 'Actualizando…' : 'Refrescar'}
              </button>
            </div>

            {usersLoading && users.length === 0 ? (
              <LoadingCard message="Cargando usuarios…" />
            ) : (
              <div className="tableWrap">
                <table className="dataTable">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Dojos</th>
                      <th>Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className="pill">{u.role}</span></td>
                        <td>
                          {(u.dojoMemberships ?? []).length === 0 && <span className="muted">—</span>}
                          {(u.dojoMemberships ?? []).map(m => (
                            <div key={m.dojoId} className="muted">
                              {m.dojo?.name ?? m.dojoId} — {m.role}
                            </div>
                          ))}
                        </td>
                        <td className="muted">{new Date(u.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="muted" style={{ marginTop: 12 }}>
              Tip: si asignas un usuario como STUDENT y seleccionas un grado, se guarda su grado inicial para ese dojo.
            </p>
          </div>
        </section>
      )}

      {tab === 'content' && (
        <section className="card stack">
          <h2>Crear contenido</h2>

          <div className="formGrid">
            <label className="fieldLabel">
              Dojo
              <select className="input" value={dojoId} onChange={e => setDojoId(e.target.value)}>
                {dojos.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label className="fieldLabel">
              Grado (opcional)
              <select className="input" value={contentForm.gradeId} onChange={e => setContentForm({ ...contentForm, gradeId: e.target.value })}>
                <option value="">(sin grado)</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.order}. {g.name}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedDojo && (
            <p className="muted">
              Dojo: {selectedDojo.name}
            </p>
          )}

          <form className="form" onSubmit={onCreateContent}>
            <div className="formGrid">
              <label className="fieldLabel">
                Título
                <input className="input" value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required />
              </label>

              <label className="fieldLabel">
                Tipo
                <select className="input" value={contentForm.type} onChange={e => setContentForm({ ...contentForm, type: e.target.value as typeof contentForm.type })}>
                  <option value="TEXT">TEXT</option>
                  <option value="LINK">LINK</option>
                  <option value="PDF">PDF</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </label>

              <label className="fieldLabel">
                URL (opcional)
                <input className="input" value={contentForm.url} onChange={e => setContentForm({ ...contentForm, url: e.target.value })} />
              </label>

              <label className="fieldLabel" style={{ gridColumn: '1 / -1' }}>
                Body (opcional)
                <textarea className="input" value={contentForm.body} onChange={e => setContentForm({ ...contentForm, body: e.target.value })} rows={4} />
              </label>
            </div>

            <button className="button" type="submit" disabled={contentLoading || !dojoId} style={{ marginTop: 14 }}>
              {contentLoading ? 'Creando…' : 'Crear contenido'}
            </button>
          </form>
        </section>
      )}

      {tab === 'monitoring' && (
        <section className="stack">
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Health</h2>
              <button className="button secondary" onClick={refreshMonitoring}>Refrescar</button>
            </div>

            {health ? (
              <pre className="codeBlock">{JSON.stringify(health, null, 2)}</pre>
            ) : (
              <p className="muted" style={{ marginTop: 12 }}>—</p>
            )}
          </div>

          <div className="card">
            <h2>Estadísticas globales</h2>
            {stats ? (
              <div className="stat-grid" style={{ marginTop: 14 }}>
                <StatCard label="Usuarios" value={stats.users} />
                <StatCard label="Dojos" value={stats.dojos} />
                <StatCard label="Contenido" value={stats.contents} />
                <StatCard label="Membresías" value={stats.memberships} />
                <StatCard label="StudentContent" value={stats.studentContents} />
                <StatCard label="Completados" value={stats.completedStudentContents} accent="success" />
                <StatCard label="Asistencias" value={stats.attendances} />
              </div>
            ) : (
              <LoadingCard message="Cargando estadísticas…" />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
