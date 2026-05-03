function formatCoords(lat, lng) {
  if (lat == null || lng == null) return 'N/A';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function Avatar({ src, name }) {
  if (src) return <img className="avatar" src={src} alt={name} />;
  return (
    <div
      className="avatar"
      style={{
        background: 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: '0.75rem', fontWeight: '700',
      }}
    >
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Sidebar({ locations, currentUser }) {
  const users = Array.from(locations.values());

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        Online <span className="sidebar-count">{users.length}</span>
      </div>
      <ul className="sidebar-list">
        {users.length === 0 && (
          <li className="sidebar-empty">No users sharing location</li>
        )}
        {users.map((loc) => {
          const isMe = loc.userId === currentUser?.id;
          return (
            <li key={loc.userId} className={`sidebar-item${isMe ? ' current-user' : ''}`}>
              <Avatar src={loc.avatar} name={loc.displayName} />
              <div>
                <div className="name">{loc.displayName}{isMe ? ' (You)' : ''}</div>
                <div className="coords">{formatCoords(loc.latitude, loc.longitude)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
