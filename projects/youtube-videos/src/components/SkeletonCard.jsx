import './SkeletonCard.css'

export default function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-thumbnail" />
      <div className="skeleton-body">
        <div className="skeleton-avatar" />
        <div className="skeleton-info">
          <div className="skeleton-line wide" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  )
}
