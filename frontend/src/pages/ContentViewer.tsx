import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/axios'

type Content = {
    id: string
    title: string
    type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK'
    url?: string | null
    body?: string | null
    gradeId?: string | null
    grade?: { name: string; order: number } | null
}

function toYouTubeEmbed(url: string) {
    try {
        const u = new URL(url)
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace('/', '')
            return `https://www.youtube.com/embed/${id}`
        }
        if (u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v')
            if (id) return `https://www.youtube.com/embed/${id}`
        }
    } catch { }
    return null
}

export default function ContentViewer() {
    const { dojoId, contentId } = useParams()
    const navigate = useNavigate()
    const [content, setContent] = useState<Content | null>(null)
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                if (!dojoId || !contentId) return
                setLoading(true)
                setErr(null)
                const res = await api.get<Content>(`/dojos/${dojoId}/contents/${contentId}`)
                if (!mounted) return
                setContent(res.data)
            } catch (e: any) {
                if (!mounted) return
                setErr(e?.response?.data?.message ?? 'No se pudo cargar el contenido')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [dojoId, contentId])

    const embedUrl = useMemo(() => {
        if (!content?.url) return null
        if (content.type === 'VIDEO') return toYouTubeEmbed(content.url) ?? content.url
        return content.url
    }, [content])

    if (loading) return <div className="card">Cargando…</div>

    if (err) {
        return (
            <div className="stack">
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>No se pudo abrir el contenido</h3>
                    <p className="muted">{err}</p>
                </div>
                <button className="button secondary" onClick={() => navigate(-1)}>
                    ← Volver
                </button>
            </div>
        )
    }

    if (!content) return null

    return (
        <div className="stack">
            <div className="card">
                <h2 style={{ marginTop: 0 }}>{content.title}</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                    {content.type}
                    {content.gradeId ? ` • ${content.grade?.name ?? 'Por grado'}` : ' • Global'}
                </p>

                {content.type === 'TEXT' && (
                    <div className="contentBody">
                        {content.body ? <p style={{ whiteSpace: 'pre-wrap' }}>{content.body}</p> : <p className="muted">Sin texto.</p>}
                    </div>
                )}

                {content.type === 'LINK' && (
                    <div style={{ marginTop: 12 }}>
                        {content.url ? (
                            <a className="button" href={content.url} target="_blank" rel="noreferrer">
                                Abrir link
                            </a>
                        ) : (
                            <p className="muted">Sin URL.</p>
                        )}
                    </div>
                )}

                {content.type === 'PDF' && (
                    <div style={{ marginTop: 12 }}>
                        {content.url ? (
                            <iframe
                                title="pdf"
                                src={content.url}
                                style={{ width: '100%', height: 700, border: '1px solid var(--border)', borderRadius: 12 }}
                            />
                        ) : (
                            <p className="muted">Este PDF no tiene URL asociada.</p>
                        )}
                    </div>
                )}

                {content.type === 'VIDEO' && (
                    <div style={{ marginTop: 12 }}>
                        {embedUrl ? (
                            <iframe
                                title="video"
                                src={embedUrl}
                                style={{ width: '100%', height: 500, border: '1px solid var(--border)', borderRadius: 12 }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <p className="muted">Este video no tiene URL asociada.</p>
                        )}
                    </div>
                )}
            </div>

            <button className="button secondary" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>
                ← Volver
            </button>
        </div>
    )
}