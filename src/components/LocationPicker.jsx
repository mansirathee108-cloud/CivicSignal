import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { AREAS, CITY_CENTER } from '../data/taxonomy';
import { distanceMeters } from '../utils/mockAI';

export function nearestArea(lat, lng) {
  return AREAS.map((a) => ({ a, d: distanceMeters(lat, lng, a.lat, a.lng) })).sort((x, y) => x.d - y.d)[0].a;
}

const pinIcon = () => L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#0b8a85;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>',
  iconSize: [30, 30], iconAnchor: [15, 30],
});

export default function LocationPicker({ value, onChange }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [geoError, setGeoError] = useState('');

  const place = (lat, lng, pan = false) => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true, icon: pinIcon() }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        onChangeRef.current({ lat: +p.lat.toFixed(5), lng: +p.lng.toFixed(5) });
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 15));
  };

  useEffect(() => {
    const start = value ? [value.lat, value.lng] : CITY_CENTER;
    const map = L.map(elRef.current).setView(start, value ? 15 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    map.on('click', (e) => {
      place(e.latlng.lat, e.latlng.lng);
      onChangeRef.current({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) });
    });
    if (value) place(value.lat, value.lng);
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => { clearTimeout(t); markerRef.current = null; map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locateMe = () => {
    setGeoError('');
    if (!navigator.geolocation) { setGeoError('Location is not supported in this browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(5), lng = +pos.coords.longitude.toFixed(5);
        place(lat, lng, true);
        onChange({ lat, lng });
      },
      () => setGeoError('Could not get your location. Tap the map to drop a pin instead.'),
      { timeout: 8000 }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted">Tap the map to drop a pin, or drag the pin to adjust.</span>
        <button type="button" onClick={locateMe} className="btn-ghost !py-1 !px-3 text-xs border border-line">
          <LocateFixed className="h-3.5 w-3.5" /> Use my location
        </button>
      </div>
      <div ref={elRef} className="h-64 w-full rounded-xl border border-line" role="application" aria-label="Pick complaint location" />
      {geoError && <p className="text-xs text-red-600 mt-1.5">{geoError}</p>}
    </div>
  );
}
