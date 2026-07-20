import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/axios'
import { useAuth } from '../auth/AuthContext'
import { getNetworkErrorMessage } from '../hooks/useNetworkStatus'
import { isNativeApp } from '../platform/native'
import { professorDojoPath } from '../platform/routes'
import { completeMyContent } from '../services/students.service'
import PageHeader from '../components/ui/PageHeader'
import LoadingCard from '../components/ui/LoadingCard'
import {
  isDirectVideoUrl,
  isSafeHttpUrl,
  isYouTubeUrl,
  openExternalUrl,
  toYouTubeEmbed,
  toYouTubeWatchUrl,
} from '../platform/openContent'

type Content = {
  id: string
  title: string
  type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK'
  url?: string | null
  body?: string | null
  gradeId?: string | null
  grade?: { name: string; order: number } | null
  completed?: boolean
}

export default function ContentViewer() {
  const { dojoId, contentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [content, setContent] = useState<Content | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [opening, setOpening] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completeMsg, setCompleteMsg] = useState<string | null>(null)
  const native = isNativeApp()

  const goBack = () => {
    if (user?.role === 'PROFESSOR' && dojoId) {
      navigate(professorDojoPath(dojoId))
      return
    }
    if (user?.role === 'STUDENT') {
      navigate('/student')
      return
    }
    navigate(-1)
  }

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
        setCompleted(Boolean(res.data.completed))
        setCompleteMsg(res.data.completed ? 'Ya completaste este contenido.' : null)
      } catch (e: any) {
        if (!mounted) return
        setErr(getNetworkErrorMessage(e) ?? e?.response?.data?.message ?? 'No se pudo cargar el contenido')
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
    if (!content?.url || !isSafeHttpUrl(content.url)) return null
    if (content.type === 'VIDEO') return toYouTubeEmbed(content.url) ?? content.url
    return content.url
  }, [content])

  const safeContentUrl =
    content?.url && isSafeHttpUrl(content.url) ? content.url : null

  const handleOpenExternal = async (url: string) => {
    try {
      setOpening(true)
      await openExternalUrl(url)
    } finally {
      setOpening(false)
    }
  }

  const handleComplete = async () => {
    if (!contentId) return
    try {
      setCompleting(true)
      setCompleteMsg(null)
      await completeMyContent(contentId)
      setCompleted(true)
      setCompleteMsg('Contenido marcado como completado. ¡Sigue así!')
    } catch (e) {
      setCompleteMsg(getNetworkErrorMessage(e) ?? 'No se pudo marcar como completado.')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return <LoadingCard message="Cargando contenido…" />

  if (err) {
    return (
      <div className="stack">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>No se pudo abrir el contenido</h3>
          <p className="muted">{err}</p>
        </div>
        <button className="button secondary" onClick={goBack}>
          ← Volver
        </button>
      </div>
    )
  }

  if (!content) return null

  const videoUrl = safeContentUrl ?? ''
  const showNativeVideoPlayer =
    content.type === 'VIDEO' && videoUrl && isDirectVideoUrl(videoUrl) && !isYouTubeUrl(videoUrl)
  const showNativeExternalVideo =
    native && content.type === 'VIDEO' && videoUrl && isYouTubeUrl(videoUrl)
  const showWebVideoEmbed =
    content.type === 'VIDEO' && embedUrl && !showNativeVideoPlayer && !showNativeExternalVideo

  return (
    <div className="stack">
      <PageHeader title={content.title} subtitle={`${content.type}${content.gradeId ? ` · ${content.grade?.name ?? 'Por grado'}` : ' · Global'}`} />

      <div className="card">
        {content.type === 'TEXT' && (
          <div className="contentBody">
            {content.body ? (
              <p style={{ whiteSpace: 'pre-wrap' }}>{content.body}</p>
            ) : (
              <p className="muted">Sin texto.</p>
            )}
          </div>
        )}

        {content.type === 'LINK' && (
          <div style={{ marginTop: 12 }}>
            {safeContentUrl ? (
              <button
                className="button"
                type="button"
                disabled={opening}
                onClick={() => void handleOpenExternal(safeContentUrl)}
              >
                {opening ? 'Abriendo…' : 'Abrir enlace'}
              </button>
            ) : (
              <p className="muted">{content.url ? 'URL no permitida (solo http/https).' : 'Sin URL.'}</p>
            )}
          </div>
        )}

        {content.type === 'PDF' && (
          <div style={{ marginTop: 12 }}>
            {safeContentUrl ? (
              native ? (
                <div className="stack">
                  <p className="muted">
                    En móvil el PDF se abre en el visor del sistema para mejor lectura.
                  </p>
                  <button
                    className="button"
                    type="button"
                    disabled={opening}
                    onClick={() => void handleOpenExternal(safeContentUrl)}
                  >
                    {opening ? 'Abriendo…' : 'Abrir PDF'}
                  </button>
                </div>
              ) : (
                <iframe
                  title="pdf"
                  src={safeContentUrl}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
                  referrerPolicy="no-referrer"
                  className="content-embed"
                />
              )
            ) : (
              <p className="muted">
                {content.url ? 'URL no permitida (solo http/https).' : 'Este PDF no tiene URL asociada.'}
              </p>
            )}
          </div>
        )}

        {content.type === 'VIDEO' && (
          <div style={{ marginTop: 12 }}>
            {!videoUrl ? (
              <p className="muted">
                {content.url ? 'URL no permitida (solo http/https).' : 'Este video no tiene URL asociada.'}
              </p>
            ) : showNativeExternalVideo ? (
              <div className="stack">
                <p className="muted">Abre el video en YouTube con un toque.</p>
                <button
                  className="button"
                  type="button"
                  disabled={opening}
                  onClick={() => void handleOpenExternal(toYouTubeWatchUrl(videoUrl))}
                >
                  {opening ? 'Abriendo…' : 'Ver en YouTube'}
                </button>
              </div>
            ) : showNativeVideoPlayer ? (
              <video
                className="content-video"
                controls
                playsInline
                preload="metadata"
                src={videoUrl}
              />
            ) : showWebVideoEmbed ? (
              <iframe
                title="video"
                src={embedUrl!}
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                referrerPolicy="no-referrer"
                className="content-embed content-embed--video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : native ? (
              <button
                className="button"
                type="button"
                disabled={opening}
                onClick={() => void handleOpenExternal(videoUrl)}
              >
                {opening ? 'Abriendo…' : 'Abrir video'}
              </button>
            ) : (
              <p className="muted">No se pudo reproducir este video.</p>
            )}
          </div>
        )}
      </div>

      {user?.role === 'STUDENT' && contentId && (
        <div className="card stack">
          <button
            className={`button${completed ? ' content-complete-done' : ''}`}
            type="button"
            disabled={completing || completed}
            onClick={() => void handleComplete()}
          >
            {completed ? 'Completado' : completing ? 'Guardando…' : 'Marcar como completado'}
          </button>
          {completeMsg ? <p className="muted">{completeMsg}</p> : null}
        </div>
      )}

      <button
        className="button secondary"
        onClick={goBack}
        style={{ width: 'fit-content' }}
      >
        ← Volver
      </button>
    </div>
  )
}
