import React, { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CITY_CENTER, SEVERITY_STYLE } from '../data/taxonomy';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sevOf = (c) => c.adminState.confirmed?.severity || c.aiPredictions.severity;

/**
 * mode="markers"  -> severity-coloured pins, grouped into numbered clusters when close together
 * mode="hotspots" -> density circles per ~650 m grid cell (open complaints only)
 */
export default function CityMap({ complaints, mode = 'markers', onSelect, selectedId, fitMaxZoom = 14, className = 'h-full w-full' }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: true }).setView(CITY_CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; };
  }, []);

  const draw = useCallback(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const list = complaints.filter((c) => c.citizenInput.location?.lat != null);

    if (mode === 'hotspots') {
      const cells = {};
      list.filter((c) => c.adminState.status !== 'Resolved').forEach((c) => {
        const { lat, lng } = c.citizenInput.location;
        const key = `${Math.round(lat / 0.006)}:${Math.round(lng / 0.006)}`;
        const cell = cells[key] || (cells[key] = { n: 0, lat: 0, lng: 0, crit: 0 });
        cell.n += 1; cell.lat += lat; cell.lng += lng;
        if (sevOf(c) === 'Critical') cell.crit += 1;
      });
      Object.values(cells).forEach((cell) => {
        const lat = cell.lat / cell.n, lng = cell.lng / cell.n;
        const color = cell.n >= 5 ? '#dc2626' : cell.n >= 3 ? '#f97316' : cell.n >= 2 ? '#f59e0b' : '#facc15';
        L.circle([lat, lng], { radius: 300 + cell.n * 90, color, weight: 1, fillColor: color, fillOpacity: 0.28 })
          .bindTooltip(`${cell.n} open complaint${cell.n > 1 ? 's' : ''}${cell.crit ? ` (${cell.crit} critical)` : ''}`)
          .addTo(layer);
      });
      list.filter((c) => c.adminState.status !== 'Resolved').forEach((c) => {
        const { lat, lng } = c.citizenInput.location;
        L.circleMarker([lat, lng], { radius: 3, color: '#0b1f3a', weight: 1, fillColor: '#0b1f3a', fillOpacity: 0.7 }).addTo(layer);
      });
    } else {
      const zoom = map.getZoom();
      const CELL = 56; // px
      const buckets = {};
      list.forEach((c) => {
        const p = map.project([c.citizenInput.location.lat, c.citizenInput.location.lng], zoom);
        const key = `${Math.floor(p.x / CELL)}:${Math.floor(p.y / CELL)}`;
        (buckets[key] = buckets[key] || []).push(c);
      });
      Object.values(buckets).forEach((group) => {
        if (group.length === 1) {
          const c = group[0];
          const hex = SEVERITY_STYLE[sevOf(c)]?.hex || '#0ea5e9';
          const selected = c.id === selectedId;
          const icon = L.divIcon({
            className: '',
            html: `<div class="cs-pin" style="background:${hex};${selected ? 'transform:scale(1.35);outline:3px solid #0b1f3a;' : ''}"></div>`,
            iconSize: [22, 22], iconAnchor: [11, 11],
          });
          L.marker([c.citizenInput.location.lat, c.citizenInput.location.lng], { icon, keyboard: true, title: c.id })
            .bindTooltip(`<b>${esc(c.id)}</b><br>${esc(c.citizenInput.title)}`)
            .on('click', () => onSelectRef.current && onSelectRef.current(c))
            .addTo(layer);
        } else {
          const lat = group.reduce((s, c) => s + c.citizenInput.location.lat, 0) / group.length;
          const lng = group.reduce((s, c) => s + c.citizenInput.location.lng, 0) / group.length;
          const size = Math.min(58, 32 + group.length * 1.4);
          const icon = L.divIcon({
            className: '',
            html: `<div class="cs-cluster" style="width:${size}px;height:${size}px">${group.length}</div>`,
            iconSize: [size, size], iconAnchor: [size / 2, size / 2],
          });
          L.marker([lat, lng], { icon })
            .bindTooltip(`${group.length} complaints - click to zoom in`)
            .on('click', () => map.fitBounds(L.latLngBounds(group.map((c) => [c.citizenInput.location.lat, c.citizenInput.location.lng])), { padding: [60, 60], maxZoom: 17 }))
            .addTo(layer);
        }
      });
    }

    if (!fittedRef.current && list.length) {
      map.fitBounds(L.latLngBounds(list.map((c) => [c.citizenInput.location.lat, c.citizenInput.location.lng])), { padding: [30, 30], maxZoom: fitMaxZoom });
      fittedRef.current = true;
    }
  }, [complaints, mode, selectedId, fitMaxZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    draw();
    map.on('zoomend', draw);
    return () => { map.off('zoomend', draw); };
  }, [draw]);

  return <div ref={elRef} className={className} role="application" aria-label="Complaint map" />;
}
