import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { PostSummaryDto } from '@uit-volunteer-map/shared';
import { getMapPosts, loadMapBoundary } from './mapData';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

interface MapViewProps {
  campaignId: number;
  posts: PostSummaryDto[];
  onMarkerClick: (post: PostSummaryDto) => void;
}

const countryBounds = L.latLngBounds([8.2, 102], [23.6, 110]);
const flowerIcon = L.icon({ iconUrl: '/map-element/map-pin-flower.svg', iconSize: [36, 36], iconAnchor: [18, 18] });

export default function MapView({ campaignId, posts, onMarkerClick }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const viewBounds = useRef(countryBounds);
  const [attempt, setAttempt] = useState(0);
  const [boundaryState, setBoundaryState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!container.current) return;
    const abort = new AbortController();
    const map = L.map(container.current, {
      minZoom: -3, maxZoom: 18, zoomSnap: 0.5, zoomDelta: 1,
      scrollWheelZoom: false, keyboard: true, attributionControl: true,
    });
    mapRef.current = map;
    markerLayer.current = L.layerGroup().addTo(map);
    map.fitBounds(countryBounds, { padding: [12, 12] });
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a>');
    const resize = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      map.fitBounds(viewBounds.current, { padding: [24, 24], maxZoom: 9, animate: false });
    });
    resize.observe(container.current);
    setBoundaryState('loading');
    void loadMapBoundary(abort.signal).then(data => {
      if (abort.signal.aborted) return;
      L.geoJSON(data, { interactive: false, style: { fillColor: '#FFF2C9', color: '#FFBA4A', weight: 1.5, fillOpacity: 0.8 } }).addTo(map);
      setBoundaryState('ready');
    }).catch(() => {
      if (!abort.signal.aborted) setBoundaryState('error');
    });
    return () => {
      abort.abort();
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      markerLayer.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const map = mapRef.current, layer = markerLayer.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const located = getMapPosts(posts, campaignId);
    const points: L.LatLngTuple[] = [];
    for (const post of located) {
      const point = post.coordinates!;
      const position: L.LatLngTuple = [point.latitude, point.longitude];
      points.push(position);
      const label = `Mở bài đăng: ${post.title}`;
      const marker = L.marker(position, { icon: flowerIcon, title: label, alt: label, keyboard: true, riseOnHover: true });
      const tooltip = document.createElement('span');
      tooltip.textContent = post.title;
      marker.bindTooltip(tooltip);
      marker.on('click', () => onMarkerClick(post));
      marker.on('add', () => {
        marker.getElement()?.addEventListener('keydown', event => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) onMarkerClick(post);
          }
        });
      });
      marker.addTo(layer);
    }
    const bounds = L.latLngBounds(countryBounds.getSouthWest(), countryBounds.getNorthEast());
    for (const point of points) bounds.extend(point);
    viewBounds.current = bounds;
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9, animate: false });
  }, [posts, campaignId, onMarkerClick, attempt]);

  return <div className="w-full flex flex-col min-w-0">
    <div className="h-60 sm:h-[380px] lg:h-[450px] shrink-0">
      <div ref={container} role="region" aria-label="Bản đồ hoạt động" className="volunteer-map w-full h-full isolate" />
    </div>
    {boundaryState === 'loading' && <p role="status" className="text-xs bg-[#FFF2C9] p-1">Đang tải nền bản đồ…</p>}
    {boundaryState === 'error' && <div role="alert" className="text-xs bg-[#FFF2C9] p-2">
      Không thể tải nền bản đồ. Bạn vẫn có thể chọn điểm bài đăng hoặc xem danh sách hoạt động.
      <button className="block underline min-h-11" onClick={() => setAttempt(value => value + 1)}>Thử tải lại nền bản đồ</button>
    </div>}
  </div>;
}
