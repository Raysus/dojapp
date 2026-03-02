import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyVisibleContents } from '../services/students.service'

type Content = {
  id: string
  title: string
  type: string
  gradeId?: string | null
}

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const res = await getMyVisibleContents()
        setData(res)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="card">Cargando…</div>
  if (!data) return <div className="card">No hay información</div>

  const dojo = data.dojo
  const dojoId = dojo?.id
  const contents: Content[] = data.contents ?? []

  return (
    <div className="stack">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>🥋 {dojo?.name}</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Aquí se muestran todos los contenidos disponibles hasta tu grado.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Contenidos</h3>

        {contents.length === 0 && (
          <p className="muted">No hay contenidos disponibles.</p>
        )}

        <ul style={{ marginTop: 12 }}>
          {contents.map(c => (
            <li
              key={c.id}
              className="content-item unlocked"
              onClick={() =>
                dojoId &&
                navigate(`/dojos/${dojoId}/contents/${c.id}`)
              }
              role="button"
              tabIndex={0}
            >
              <b>{c.title}</b>
              <div className="muted" style={{ fontSize: 12 }}>
                {c.type}
                {c.gradeId ? '' : ' • Global'}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}