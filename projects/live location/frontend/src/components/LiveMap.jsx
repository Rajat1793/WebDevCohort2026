import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const currentUserDot = new L.DivIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#35858e;border:2.5px solid white;box-shadow:0 0 0 3px rgba(53,133,142,0.3);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

const otherUserDot = new L.DivIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#7da78c;border:2.5px solid white;box-shadow:0 0 0 3px rgba(125,167,140,0.3);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

function FlyToUser({ position, userId }) {
  const map = useMap();
  const hasFlewRef = useRef(false);
  const lastUserIdRef = useRef(null);

  useEffect(() => {
    // Reset whenever the logged-in user changes (login/logout cycle)
    if (userId !== lastUserIdRef.current) {
      hasFlewRef.current = false;
      lastUserIdRef.current = userId;
    }
    if (position && !hasFlewRef.current) {
      map.flyTo([position.latitude, position.longitude], 15, { duration: 1.5 });
      hasFlewRef.current = true;
    }
  }, [position, userId, map]);
  return null;
}

function MovingMarker({ position, icon, tooltip, isCurrentUser, children }) {
  const markerRef = useRef(null);
  useEffect(() => {
    if (markerRef.current && position) markerRef.current.setLatLng([position[0], position[1]]);
  }, [position]);
  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      <Tooltip permanent direction="top" offset={[0, -10]} className={isCurrentUser ? 'label-tooltip label-tooltip--me' : 'label-tooltip'}>
        {tooltip}
      </Tooltip>
      {children}
    </Marker>
  );
}

function formatTime(ts) {
  return ts ? new Date(ts).toLocaleTimeString() : '';
}

export default function LiveMap({ locations, currentUser, currentPosition }) {
  const initialCenter = currentPosition
    ? [currentPosition.latitude, currentPosition.longitude]
    : [28.6139, 77.209];

  const otherUsers = Array.from(locations.values()).filter((loc) => loc.userId !== currentUser?.id);

  return (
    <MapContainer center={initialCenter} zoom={13} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FlyToUser position={currentPosition} userId={currentUser?.id} />

      {currentPosition && (
        <MovingMarker
          position={[currentPosition.latitude, currentPosition.longitude]}
          icon={currentUserDot}
          tooltip={`${currentUser?.displayName} (You)`}
          isCurrentUser
        >
          <Popup>
            <div className="marker-popup">
              <div className="popup-name">📍 {currentUser?.displayName} (You)</div>
              <div className="popup-coords">{currentPosition.latitude.toFixed(5)}, {currentPosition.longitude.toFixed(5)}</div>
              <div className="popup-time">Live GPS</div>
            </div>
          </Popup>
        </MovingMarker>
      )}

      {otherUsers.map((loc) => (
        <MovingMarker key={loc.userId} position={[loc.latitude, loc.longitude]} icon={otherUserDot} tooltip={loc.displayName} isCurrentUser={false}>
          <Popup>
            <div className="marker-popup">
              <div className="popup-name">👤 {loc.displayName}</div>
              <div className="popup-coords">{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</div>
              <div className="popup-time">Updated: {formatTime(loc.timestamp)}</div>
            </div>
          </Popup>
        </MovingMarker>
      ))}
    </MapContainer>
  );
}
