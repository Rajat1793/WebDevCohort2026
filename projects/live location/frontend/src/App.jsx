import { useState } from 'react';
import { useAuth, useSocket, useGeolocation } from './hooks';
import Header from './components/Header';
import LiveMap from './components/LiveMap';
import Sidebar from './components/Sidebar';

function LoginPage({ onLogin }) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">📍</div>
        <h1>Live Location Tracker</h1>
        <p>Share your real-time location and see others moving on the map.</p>
        <button className="btn-signin" onClick={onLogin}>🔐 Sign In</button>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={login} />;

  // key={user.id} forces a full remount of the tracked app whenever the
  // logged-in user changes — resets isSharing, geolocation watch, and
  // FlyToUser so the map always centres on the new user's location.
  return <TrackedApp key={user.id} user={user} logout={logout} />;
}

function TrackedApp({ user, logout }) {
  const { connected, locations, sendLocation } = useSocket(user);
  const [isSharing, setIsSharing] = useState(false);
  const { permissionState, currentPosition, requestPermission } = useGeolocation(sendLocation, isSharing);

  const handleStartSharing = () => {
    if (permissionState !== 'granted') requestPermission();
    setIsSharing(true);
  };

  return (
    <div className="app-container">
      <Header
        user={user}
        connected={connected}
        isSharing={isSharing}
        onLogout={logout}
      />

      {permissionState === 'denied' && (
        <div className="permission-banner">
          ⚠️ Location permission denied. Enable location access in browser settings.
        </div>
      )}

      {permissionState !== 'denied' && !isSharing && (
        <div className="permission-banner">
          📡 Share your location with others on the map.
          <button className="btn" onClick={handleStartSharing}>Start Sharing</button>
        </div>
      )}

      {isSharing && permissionState === 'granted' && (
        <div className="permission-banner active">
          ✅ Broadcasting every 3s — you are visible on the map.
          <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={() => setIsSharing(false)}>Stop</button>
        </div>
      )}

      <div className="map-wrapper">
        <LiveMap locations={locations} currentUser={user} currentPosition={currentPosition} />
        <Sidebar locations={locations} currentUser={user} />
      </div>
    </div>
  );
}
