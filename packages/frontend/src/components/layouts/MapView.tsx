import { useEffect, useRef } from "react";
import L, { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

declare module "leaflet" {
  interface Layer {
    __labelMarker?: L.Marker;
  }
  interface GeoJSONOptions {
    renderer?: L.Renderer;
  }
}

export interface MarkerData {
  title?: string;
  x?: number;
  y?: number;
  [key: string]: unknown;
}

interface MapViewProps {
  onMarkerClick: (data: MarkerData) => void;
  onMarkerHover: (data: MarkerData | null) => void;
}

const highlightLabel = (marker: L.Marker) => {
  const el = marker.getElement();
  if (!el) return;

  el.classList.add("label-highlight");
};

const resetLabel = (marker: L.Marker) => {
  const el = marker.getElement();
  if (!el) return;

  el.classList.remove("label-highlight");
};

const mapBounds = L.latLngBounds(
  [2, 95],
  [30, 120]
);

const MapView: React.FC<MapViewProps> = ({ onMarkerClick, onMarkerHover }) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return;

    // ===============================
    // 1. Init Map
    // ===============================
    
    

    const map = L.map("map", {
      minZoom: 4,
      maxZoom: 14,
      zoomSnap: 2,
      zoomDelta: 2,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
      maxBounds: mapBounds,

      dragging: true,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    }).setView([10.8231, 106.6296], 6); // TP. HCM
    //.setView([16.047079, 108.206231], 4); // Toàn map

    console.log("scrollWheelZoom", map.scrollWheelZoom.enabled());
    console.log("doubleClickZoom", map.doubleClickZoom.enabled());
    console.log("touchZoom", map.touchZoom.enabled());

    mapRef.current = map;
    // Resize map after container size stable
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
    // ===============================
    // 2. Tile Layer (OSM / Esri) (Optional)
    // ===============================
    /*L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 14,
      },
    ).addTo(map);*/

    // ===============================
    // 3. Layer Groups
    // ===============================
    const areasGroup = L.layerGroup();
    const tinhLayer = L.layerGroup();
    const xaLayer = L.layerGroup();
    const tinhLabelLayer = L.layerGroup();
    const xaLabelLayer = L.layerGroup();
    const annotationLayer = L.layerGroup();

    // ===============================
    // 4. Utils
    // ===============================
    const visitedTinh = [
      // Todo: Thay cái này bằng Gọi API
      "TP. Hồ Chí Minh",
      "Gia Lai",
      "Đắk Lắk",
      "Vĩnh Long",
    ];

    const getColor = (tenTinh?: string) =>
      visitedTinh.includes(tenTinh ?? "") ? "#FF632A" : "#FFF2C9";

    const getOpacity = (tenXa?: string) => (tenXa ? 1 : 1);

    const hoverStyle = (): L.PathOptions => ({
      weight: 2,
      color: "#FFBA4A",
      fillOpacity: 0.6,
    });

    // ===============================
    // 5. Arrow Marker
    // ===============================
    const normalIcon = L.icon({
      iconUrl: "/map-element/map-pin-flower.svg",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const hoverIcon = L.icon({
      iconUrl: "/map-element/map-pin-flower.svg",
      iconSize: [42, 42],      // phóng to
      iconAnchor: [21, 21],    // giữ đúng tâm
    });
    
    const createArrowIcon = () => normalIcon

    // ===============================
    // 6. Load Annotations
    // ===============================
    fetch("/data/annotations.geojson")
      .then((res) => res.json())
      .then((data) => {
        L.geoJSON(data, {
          pointToLayer: (_feature, latlng) =>
            L.marker(latlng, {
              icon: createArrowIcon(),
            }),
          onEachFeature: (feature, layer) => {
            layer.on("click", (e) => {
              console.log("Annotation:", feature.properties);
              L.DomEvent.stopPropagation(e);
              onMarkerClick(feature.properties); // Todo : Thay '1' bằng dữ liệu thực tế của bạn
            });

            layer.on("mouseover", (e: LeafletMouseEvent) => {
              const marker = e.target as L.Marker;
              marker.setIcon(hoverIcon);
              onMarkerHover({
                title: feature.properties.title,
                x: e.originalEvent.clientX,
                y: e.originalEvent.clientY,
                // Bạn có thể lấy tọa độ chuột để hiển thị BasicInfo ngay tại con trỏ
              });
            });

            // 3. Sự kiện RỜI CHUỘT (Mouse Out)
            layer.on("mouseout", (e: LeafletMouseEvent) => {
              const marker = e.target as L.Marker;
              marker.setIcon(normalIcon);
              onMarkerHover(null); // Xóa dữ liệu hover để ẩn Component đi
            });
          },
        }).addTo(annotationLayer);
      });

    annotationLayer.addTo(map);
    // ===============================
    // 7. Load GeoJSON Areas
    // ===============================
    const canvasRenderer = L.canvas();

    const loadGeoJSONFile = async (fileName: string) => {
      try {
        const res = await fetch(`/data/${fileName}`);
        const data: GeoJSON.FeatureCollection = await res.json();

        if (!data.features || data.features.length === 0) {
          console.warn("Empty geojson:", fileName);
          return;
        }

        // ===== Base style (1 nơi duy nhất) =====
        const baseStyle: L.PathOptions = {
          fillColor: getColor(data.features[0].properties?.ten_tinh),
          weight: 1,
          fillOpacity: getOpacity(data.features[0].properties?.ten_xa),
          color: "#FFBA4A",
          className: "area-layer",
        };

        // ===== Tạo GeoJSON layer =====
        const geoJsonLayer = L.geoJSON(data, {
          style: baseStyle,
          renderer: canvasRenderer,
          onEachFeature: (feature, featureLayer) => {
            const layer = featureLayer as L.Path;
            const polygonLayer = featureLayer as L.Polygon | L.Polyline;

            // ===== Add vào layer phù hợp =====
            let labelMarker: L.Marker | null = null;
            if (feature.properties?.ten_xa === undefined) {
              tinhLayer.addLayer(featureLayer);

              const bounds = polygonLayer.getBounds();
              const center = bounds.getCenter();
              labelMarker = L.marker(center, {
                interactive: false, // không chặn event
                icon: L.divIcon({
                  className: "area-label area-tinh",
                  html: feature.properties.ten_tinh,
                }),
              });

              tinhLabelLayer.addLayer(labelMarker);
            } else {
              xaLayer.addLayer(featureLayer);

              const bounds = polygonLayer.getBounds();
              const center = bounds.getCenter();
              labelMarker = L.marker(center, {
                interactive: false, // không chặn event
                icon: L.divIcon({
                  className: "area-label area-xa",
                  html: feature.properties.ten_xa,
                }),
              });

              xaLabelLayer.addLayer(labelMarker);
            }

            layer.__labelMarker = labelMarker;
            // ===== Hover (KHÔNG dùng resetStyle) =====
            featureLayer.on({
              mouseover: () => {
                layer.setStyle(hoverStyle());
                layer.bringToFront();
                highlightLabel(labelMarker);
              },
              mouseout: () => {
                layer.setStyle(baseStyle);
                resetLabel(labelMarker);
              },
            });
          },
        });

        // ===== Add vào map (QUAN TRỌNG) =====
        geoJsonLayer.addTo(areasGroup);

        console.log("Loaded geojson:", fileName);
      } catch (err) {
        console.error("Failed to load geojson:", fileName, err);
      }
    };

    // ===============================
    // 8. Load index.json
    // ===============================
    fetch("/data/index.json")
      .then((res) => res.json())
      .then(async (files: string[]) => {
        for (const file of files) {
          await loadGeoJSONFile(file);
        }
      });

    // ===============================
    // 9. Zoom Control
    // ===============================
    const updateByZoom = () => {
      console.log("updateByZoom");
      const z = map.getZoom();

      map.removeLayer(xaLayer);
      map.removeLayer(xaLabelLayer);
      map.removeLayer(tinhLayer);
      map.removeLayer(tinhLabelLayer);

      if (z >= 12) {
        map.addLayer(xaLayer);
        map.addLayer(xaLabelLayer);
      } else if (z >= 8) {
        map.addLayer(xaLayer);
      }
      if (z < 12) {
        map.addLayer(tinhLayer);
        if (z >= 8) {
          map.addLayer(tinhLabelLayer);
        }
      }
    };

    map.on("zoomend", updateByZoom);
    map.on("zoom", () => {
      console.log("zoom event", map.getZoom());
    });

    map.on("zoomend", () => {
      console.log("zoomend event", map.getZoom());
    });
    map.whenReady(updateByZoom);
    // ===============================
    // Cleanup
    // ===============================
    return () => {
      //isMountedRef.current = false;
      //map.off();
      areasGroup.clearLayers();
      tinhLayer.clearLayers();
      xaLayer.clearLayers();
      tinhLabelLayer.clearLayers();
      xaLabelLayer.clearLayers();
      annotationLayer.clearLayers();

      //map.remove();
    };
  }, [onMarkerClick, onMarkerHover]);

  return <div id="map" style={{ width: "80vw", height: "80vh" , zIndex: 22, isolation: "isolate"}} />;
};

export default MapView;
