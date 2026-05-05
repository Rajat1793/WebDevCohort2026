import VideoCard from './VideoCard'
import SkeletonCard from './SkeletonCard'
import './VideoGrid.css'

export default function VideoGrid({ videos, loading, loadingMore, hasMore, onLoadMore }) {
  if (loading) {
    return (
      <div>
        <div className="section-header">
          <h2 className="section-title">Trending Videos</h2>
        </div>
        <div className="video-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <h3>No videos found</h3>
        <p>Try a different search term</p>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Trending Videos</h2>
        <span className="section-count">{videos.length} videos</span>
      </div>
      <div className="video-grid">
        {videos.map(video => (
          <VideoCard key={video._id} video={video} />
        ))}
        {loadingMore &&
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`more-${i}`} />)}
      </div>
      {hasMore && !loadingMore && (
        <div className="load-more-wrapper">
          <button className="load-more-btn" onClick={onLoadMore}>
            Load more videos
          </button>
        </div>
      )}
    </div>
  )
}
