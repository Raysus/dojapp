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

type Tab = 'users' | 'content' | 'monitoring';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users');

  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<{ ok: boolean; timestamp: string; uptimeSeconds: number } | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'ADMIN' | 'PROFESSOR' | 'STUDENT',
  });

  const [assignForm, setAssignForm] = useState({
    userId: '',
    dojoId: '',
    dojoRole: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR' | 'PROFESSOR',
    gradeId: '',
  });
  const [assignGrades, setAssignGrades] = useState<AdminGrade[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

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
  }, []);

  useEffect(() => {
    loadGrades(dojoId);
    setContentForm(prev => ({ ...prev, gradeId: '' }));
  }, [dojoId]);

  useEffect(() => {
    loadAssignGrades(assignForm.dojoId);
    setAssignForm(prev => ({ ...prev, gradeId: '' }));
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
    <div className="page">
      <header className="header">
        <div>
          <h1>Admin</h1>
          <p className="muted">Usuarios, contenido, monitoreo y estadísticas.</p>
        </div>
        <nav className="tabs">
          <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>Usuarios</button>
          <button className={tab === 'content' ? 'tab active' : 'tab'} onClick={() => setTab('content')}>Contenido</button>
          <button className={tab === 'monitoring' ? 'tab active' : 'tab'} onClick={() => setTab('monitoring')}>Monitoreo</button>
        </nav>
      </header>

      {error && (
        <div className="alert error">
          <b>Error:</b> {error}
        </div>
      )}

      {tab === 'users' && (
        <section >
          <div className="card">
            <h2>Crear usuario</h2>
            <form className="form" onSubmit={onCreateUser}>
              <div className="grid">
                <label>
                  Nombre
                  <input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
                </label>

                <label>
                  Email
                  <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                </label>

                <label>
                  Password
                  <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />
                </label>

                <label>
                  Rol
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="PROFESSOR">PROFESSOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
              </div>

              <div className="row">
                <button className="btn" type="submit">Crear</button>
                <button className="btn" type="button" onClick={refreshUsers} disabled={usersLoading}>
                  {usersLoading ? 'Actualizando…' : 'Refrescar usuarios'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2>Asignar usuario a un dojo</h2>
            <p className="muted">Sin copiar UUIDs: selecciona usuario, dojo, rol y (si corresponde) grado.</p>

            <form className="form" onSubmit={onAssignUser}>
              <div className="grid">
                <label>
                  Usuario
                  <select value={assignForm.userId} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Dojo
                  <select value={assignForm.dojoId} onChange={e => setAssignForm({ ...assignForm, dojoId: e.target.value })}>
                    {dojos.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Rol en dojo
                  <select value={assignForm.dojoRole} onChange={e => setAssignForm({ ...assignForm, dojoRole: e.target.value as any })}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="PROFESSOR">PROFESSOR</option>
                  </select>
                </label>

                <label>
                  Grado (solo si STUDENT)
                  <select
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

              <div className="row">
                <button className="btn" type="submit" disabled={assignLoading}>
                  {assignLoading ? 'Asignando…' : 'Asignar'}
                </button>
                <span className="muted">
                  {selectedAssignDojo ? `Dojo seleccionado: ${selectedAssignDojo.name}` : ''}
                </span>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Usuarios</h2>
              <button className="btn" onClick={refreshUsers} disabled={usersLoading}>
                {usersLoading ? 'Actualizando…' : 'Refrescar'}
              </button>
            </div>

            <div className="tableWrap">
              <table className="table">
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
                      <td >{u.email}</td>
                      <td >{u.role}</td>
                      <td>
                        {(u.dojoMemberships ?? []).length === 0 && <span className="muted">—</span>}
                        {(u.dojoMemberships ?? []).map(m => (
                          <div key={m.dojoId} className="muted">
                            <span >{m.dojo?.name ?? m.dojoId}</span> — <span >{m.role}</span>
                          </div>
                        ))}
                      </td>
                      <td >{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="muted" style={{ marginTop: 12 }}>
              Tip: si asignas un usuario como <span >STUDENT</span> y seleccionas un grado, se guarda su grado inicial para ese dojo.
            </p>
          </div>
        </section>
      )}

      {tab === 'content' && (
        <section className="card">
          <h2>Crear contenido</h2>

          <div className="grid">
            <label>
              Dojo
              <select value={dojoId} onChange={e => setDojoId(e.target.value)}>
                {dojos.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label>
              Grado (opcional)
              <select value={contentForm.gradeId} onChange={e => setContentForm({ ...contentForm, gradeId: e.target.value })}>
                <option value="">(sin grado)</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.order}. {g.name}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedDojo && (
            <p className="muted">
              Dojo: <span >{selectedDojo.name}</span> — id <span >{selectedDojo.id}</span>
            </p>
          )}

          <form className="form" onSubmit={onCreateContent}>
            <div className="grid">
              <label>
                Título
                <input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required />
              </label>

              <label>
                Tipo
                <select value={contentForm.type} onChange={e => setContentForm({ ...contentForm, type: e.target.value as any })}>
                  <option value="TEXT">TEXT</option>
                  <option value="LINK">LINK</option>
                  <option value="PDF">PDF</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </label>

              <label>
                URL (opcional)
                <input value={contentForm.url} onChange={e => setContentForm({ ...contentForm, url: e.target.value })} />
              </label>

              <label>
                Body (opcional)
                <textarea value={contentForm.body} onChange={e => setContentForm({ ...contentForm, body: e.target.value })} rows={4} />
              </label>
            </div>

            <button className="btn" type="submit" disabled={contentLoading || !dojoId}>
              {contentLoading ? 'Creando…' : 'Crear contenido'}
            </button>
          </form>
        </section>
      )}

      {tab === 'monitoring' && (
        <section >
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2>Health</h2>
              <button className="btn" onClick={refreshMonitoring}>Refrescar</button>
            </div>

            {health ? (
              <pre >{JSON.stringify(health, null, 2)}</pre>
            ) : (
              <p className="muted">—</p>
            )}
          </div>

          <div className="card">
            <h2>Stats</h2>
            {stats ? (
              <div className="grid">
                <div className="stat"><b>Usuarios</b><div >{stats.users}</div></div>
                <div className="stat"><b>Dojos</b><div >{stats.dojos}</div></div>
                <div className="stat"><b>Contenido</b><div >{stats.contents}</div></div>
                <div className="stat"><b>Membresías</b><div >{stats.memberships}</div></div>
                <div className="stat"><b>StudentContent</b><div >{stats.studentContents}</div></div>
                <div className="stat"><b>Completados</b><div >{stats.completedStudentContents}</div></div>
                <div className="stat"><b>Asistencias</b><div >{stats.attendances}</div></div>
              </div>
            ) : (
              <p className="muted">—</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
