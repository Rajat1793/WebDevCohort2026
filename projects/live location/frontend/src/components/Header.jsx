export default function Header({ user, connected, isSharing, onLogout }) {
  return (
    <header className="header">
      <h1>📍 Live Location Tracker</h1>
      <div className="header-right">
        <span className={`status-badge ${isSharing ? 'sharing' : connected ? 'connected' : 'disconnected'}`}>
          {isSharing ? '● Live' : connected ? 'Connected' : 'Offline'}
        </span>
        <div className="user-info">
          {user.avatar && <img className="user-avatar" src={user.avatar} alt={user.displayName} />}
          <span className="user-name">{user.displayName}</span>
        </div>
        <button className="btn btn-logout" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
