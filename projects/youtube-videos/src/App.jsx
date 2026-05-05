import { useState, useEffect, useCallback } from 'react'
import VideoCard from './VideoCard'

const API = 'https://api.freeapi.app/api/v1/public/youtube/videos'

function SkeletonCard() {
  return (
    <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden border border-[#2e2e2e]">
      <div className="aspect-video animate-pulse bg-[#2a2a2a]" />
      <div className="p-3.5 flex gap-3">
        <div className="w-9 h-9 shrink-0 rounded-full animate-pulse bg-[#2a2a2a]" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-[#2a2a2a] rounded-full animate-pulse" />
          <div className="h-3 bg-[#2a2a2a] rounded-full animate-pulse w-4/5" />
          <div className="h-3 bg-[#2a2a2a] rounded-full animate-pulse w-3/5" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [query, setQuery] = useState('')

  const fetchVideos = useCallback(async (pageNum, append = false) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true)
      const res = await fetch(`${API}?page=${pageNum}&limit=12`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const items = json.data?.data ?? []
      setVideos(prev => (append ? [...prev, ...items] : items))
      setHasMore(pageNum < (json.data?.totalPages ?? 1))
      setError(null)
    } catch {
      setError('Failed to load videos. Check your connection and try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { fetchVideos(1) }, [fetchVideos])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchVideos(next, true)
  }

  const filtered = query.trim()
    ? videos.filter(v => {
        const s = v.items?.snippet
        const q = query.toLowerCase()
        return s?.title?.toLowerCase().includes(q) || s?.channelTitle?.toLowerCase().includes(q)
      })
    : videos

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#2e2e2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4 sm:gap-6">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0 no-underline">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022z" fill="#ff6b35" />
              <path d="M10 15.5V8.5L16 12Z" fill="white" />
            </svg>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[#ff6b35] font-bold text-sm tracking-tight">FreeAPI</span>
              <span className="text-[#717171] text-[0.64rem] uppercase tracking-wider">Videos</span>
            </div>
          </a>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md group">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171] group-focus-within:text-[#ff6b35] transition-colors pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search videos or channels..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-full py-2.5 pl-10 pr-10 text-sm text-[#f1f1f1] placeholder:text-[#717171] outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 focus:bg-[#1e1e1e] transition-all"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Live badge */}
          <div className="hidden sm:flex items-center gap-2 ml-auto text-xs text-[#717171] shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)] animate-pulse" />
            Live API
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-4 bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-xl px-5 py-3.5 mb-6">
            <p className="text-[#ff8c5a] text-sm m-0">{error}</p>
            <button
              onClick={() => fetchVideos(1)}
              className="shrink-0 bg-[#ff6b35] hover:bg-[#e85520] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-6 bg-[#ff6b35] rounded-full" />
          <h2 className="text-lg font-bold m-0">Trending Videos</h2>
          {!loading && (
            <span className="text-[#717171] text-sm font-normal">{filtered.length} videos</span>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length
              ? filtered.map(v => <VideoCard key={v.items?.id ?? v._id} video={v} />)
              : (
                <div className="col-span-full flex flex-col items-center gap-3 py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#ff6b35]/10 flex items-center justify-center text-[#ff6b35]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <p className="font-semibold m-0">No results found</p>
                  <p className="text-[#717171] text-sm m-0">Try a different search term</p>
                </div>
              )
          }
          {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`m${i}`} />)}
        </div>

        {/* Load more */}
        {hasMore && !loading && !loadingMore && !query && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              className="border border-[#ff6b35]/40 text-[#ff6b35] bg-[#ff6b35]/10 hover:bg-[#ff6b35] hover:text-white px-10 py-3 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Load more videos
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
