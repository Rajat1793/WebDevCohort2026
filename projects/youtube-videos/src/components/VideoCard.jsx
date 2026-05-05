import { useState } from 'react'
import './VideoCard.css'

function formatCount(n) {
  if (!n) return '0'
  const num = parseInt(n, 10)
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toString()
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

function parseDuration(iso) {
  if (!iso) return ''
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''
  const h = parseInt(match[1] || '0', 10)
  const m = parseInt(match[2] || '0', 10)
  const s = parseInt(match[3] || '0', 10)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VideoCard({ video }) {
  const [imgError, setImgError] = useState(false)
  const snippet = video?.videoId?.snippet ?? {}
  const stats = video?.videoId?.statistics ?? {}
  const contentDetails = video?.videoId?.contentDetails ?? {}

  const title = snippet.title ?? 'Untitled'
  const channel = snippet.channelTitle ?? 'Unknown Channel'
  const publishedAt = snippet.publishedAt ?? ''
  const views = stats.viewCount ?? '0'
  const likes = stats.likeCount ?? '0'
  const duration = parseDuration(contentDetails.duration)

  const thumbnails = snippet.thumbnails ?? {}
  const thumbnail =
    thumbnails.maxres?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ''

  const videoId = video?.videoId?.id ?? ''
  const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '#'

  return (
    <article className="video-card">
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="thumbnail-wrapper"
        aria-label={`Watch ${title}`}
      >
        {!imgError && thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="thumbnail"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="thumbnail-fallback">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022z"
                fill="var(--papaya)"
                opacity="0.4"
              />
              <path d="M10 15.5V8.5L16 12L10 15.5Z" fill="var(--papaya)" />
            </svg>
          </div>
        )}

        {duration && <span className="duration-badge">{duration}</span>}

        <div className="play-overlay">
          <div className="play-button">
            <svg viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </a>

      <div className="card-body">
        <div className="channel-avatar" aria-hidden="true">
          {channel.charAt(0).toUpperCase()}
        </div>

        <div className="card-info">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="video-title"
            title={title}
          >
            {title}
          </a>
          <span className="channel-name">{channel}</span>
          <div className="meta-row">
            <span className="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {formatCount(views)}
            </span>
            <span className="meta-dot" aria-hidden="true">·</span>
            <span className="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
              {formatCount(likes)}
            </span>
            <span className="meta-dot" aria-hidden="true">·</span>
            <span className="meta-item time">{timeAgo(publishedAt)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
