import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => {
    window.location.href = `${API_URL}/auth/login`;
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}

export function useSocket(user) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [locations, setLocations] = useState(new Map());
  const locationsRef = useRef(new Map());

  useEffect(() => {
    if (!user) return;

    const s = io(API_URL, { withCredentials: true, transports: ['websocket', 'polling'] });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));

    s.on('location:update', (data) => {
      locationsRef.current = new Map(locationsRef.current);
      locationsRef.current.set(data.userId, {
        userId: data.userId,
        displayName: data.displayName,
        avatar: data.avatar,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      });
      setLocations(new Map(locationsRef.current));
    });

    s.on('user:disconnected', (data) => {
      locationsRef.current = new Map(locationsRef.current);
      locationsRef.current.delete(data.userId);
      setLocations(new Map(locationsRef.current));
    });

    setSocket(s);
    return () => { s.disconnect(); setSocket(null); setConnected(false); };
  }, [user]);

  const sendLocation = useCallback(
    (latitude, longitude) => {
      if (!socket || !connected || !user) return;
      socket.emit('location:send', { latitude, longitude });
      locationsRef.current = new Map(locationsRef.current);
      locationsRef.current.set(user.id, {
        userId: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        latitude,
        longitude,
        timestamp: Date.now(),
      });
      setLocations(new Map(locationsRef.current));
    },
    [socket, connected, user],
  );

  return { socket, connected, locations, sendLocation };
}

export function useGeolocation(sendLocation, isSharing) {
  const [permissionState, setPermissionState] = useState('prompt');
  const [currentPosition, setCurrentPosition] = useState(null);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) { setPermissionState('denied'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        setCurrentPosition({ latitude, longitude });
        setPermissionState('granted');
      },
      (err) => { if (err.code === 1) setPermissionState('denied'); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  }, []);

  const requestPermission = useCallback(() => startWatching(), [startWatching]);

  useEffect(() => {
    if (isSharing && currentPosition) {
      sendLocation(currentPosition.latitude, currentPosition.longitude);
      intervalRef.current = setInterval(() => {
        sendLocation(currentPosition.latitude, currentPosition.longitude);
      }, 3000);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isSharing, currentPosition, sendLocation]);

  useEffect(() => {
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  return { permissionState, currentPosition, requestPermission };
}
