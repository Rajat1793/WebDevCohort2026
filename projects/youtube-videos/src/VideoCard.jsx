function formatCount(n) {
  const num = parseInt(n ?? 0, 10)
  if (isNaN(num)) return '0'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toLocaleString()
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
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
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null
  const h = parseInt(match[1] ?? 0, 10)
  const m = parseInt(match[2] ?? 0, 10)
  const s = parseInt(match[3] ?? 0, 10)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VideoCard({ video }) {
  // API shape: video.items.{ id, snippet, contentDetails, statistics }
  const { id, snippet, contentDetails, statistics } = video.items

  const thumb =
    snippet.thumbnails?.maxres?.url ??
    snippet.thumbnails?.standard?.url ??
    snippet.thumbnails?.high?.url ??
    snippet.thumbnails?.medium?.url ??
    snippet.thumbnails?.default?.url

  const ytUrl = `https://www.youtube.com/watch?v=${id}`
  const duration = parseDuration(contentDetails?.duration)
  const views = formatCount(statistics?.viewCount)
  const likes = formatCount(statistics?.likeCount)
  const comments = formatCount(statistics?.commentCount)
  const posted = timeAgo(snippet.publishedAt)
  const isHD = contentDetails?.definition === 'hd'

  return (
    <article className="group bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-[#ff6b35]/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)] transition-all duration-200">
      {/* Thumbnail */}
      <a
        href={ytUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video overflow-hidden bg-[#1a1a1a]"
      >
        <img
          src={thumb}
          alt={snippet.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {isHD && (
            <span className="bg-black/80 text-[#ff6b35] text-[0.6rem] font-bold px-1 py-0.5 rounded border border-[#ff6b35]/40">
              HD
            </span>
          )}
          {duration && (
            <span className="bg-black/80 text-white text-[0.68rem] font-semibold px-1.5 py-0.5 rounded">
              {duration}
            </span>
          )}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-[#ff6b35] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,107,53,0.6)] scale-90 group-hover:scale-100 transition-transform duration-200">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </a>

      {/* Card body */}
      <div className="p-3.5 flex gap-3">
        {/* Channel avatar */}
        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#e85520] to-[#ff8c5a] flex items-center justify-center text-white text-sm font-bold select-none mt-0.5">
          {snippet.channelTitle?.[0]?.toUpperCase() ?? '?'}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={snippet.title}
            className="block text-[0.875rem] font-semibold leading-snug line-clamp-2 text-[#f1f1f1] hover:text-[#ff6b35] transition-colors no-underline"
          >
            {snippet.title}
          </a>

          <a
            href={`https://www.youtube.com/channel/${snippet.channelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[#aaa] text-xs mt-1 truncate hover:text-[#ff8c5a] transition-colors no-underline"
          >
            {snippet.channelTitle}
          </a>

          {/* Stats row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[#717171] text-xs">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              {views}
            </span>
            <span className="text-[#3e3e3e]">·</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
              {likes}
            </span>
            <span className="text-[#3e3e3e]">·</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              {comments}
            </span>
            <span className="text-[#3e3e3e]">·</span>
            <span>{posted}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
