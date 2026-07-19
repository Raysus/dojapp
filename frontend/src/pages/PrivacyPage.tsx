import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function PrivacyPage() {
  useDocumentTitle();

  return (
    <div className="stack">
      <PageHeader
        title="Política de privacidad"
        subtitle="Cómo Dojapp trata datos de alumnos, profesores y administradores."
        action={
          <Link className="link" to="/">
            ← Volver
          </Link>
        }
      />

      <article className="card stack privacyDoc">
        <p>
          Dojapp es una aplicación de gestión de dojos (asistencia, grados y contenidos). Esta
          política describe qué datos se tratan y con qué fin.
        </p>

        <h3>Datos que tratamos</h3>
        <ul>
          <li>Cuenta: nombre, email, rol y contraseña (almacenada con hash).</li>
          <li>Membresías a dojos, grados y progreso de contenidos.</li>
          <li>Registros de asistencia tomados por el staff del dojo.</li>
          <li>Tokens de sesión (access/refresh) para mantenerte autenticado.</li>
        </ul>

        <h3>Finalidad</h3>
        <p>
          Operar el dojo digital: login, listados de alumnos, contenidos por grado, asistencia y
          métricas para profesores/administradores.
        </p>

        <h3>Conservación y seguridad</h3>
        <p>
          Los datos viven en la base del operador del dojo (p. ej. Neon/Railway o un servidor
          propio). Las contraseñas no se guardan en claro. Los refresh tokens se pueden revocar al
          cerrar sesión.
        </p>

        <h3>Tus derechos</h3>
        <p>
          Puedes solicitar corrección o borrado de tu cuenta al administrador del dojo. Para
          dudas: contacta al responsable que te dio acceso a la app.
        </p>

        <p className="muted">Última actualización: julio 2026. Documento orientativo para prueba interna.</p>
      </article>
    </div>
  );
}
