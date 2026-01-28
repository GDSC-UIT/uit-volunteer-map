import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

declare module 'leaflet' {
  interface Layer {
    __labelMarker?: L.Marker;
  }
  interface GeoJSONOptions {
    renderer?: L.Renderer;
  }
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

const MapView: React.FC = () => {
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

      dragging: true,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    }).setView([10.762622, 107], 6); // TP. HCM
    //.setView([16.047079, 108.206231], 4); // Toàn map

    console.log("scrollWheelZoom", map.scrollWheelZoom.enabled());
    console.log("doubleClickZoom", map.doubleClickZoom.enabled());
    console.log("touchZoom", map.touchZoom.enabled());

    mapRef.current = map;

    // ===============================
    // 2. Tile Layer (OSM / Esri) (Optional)
    // ===============================
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 14,
      },
    ).addTo(map);

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
      visitedTinh.includes(tenTinh ?? "") ? "#3498db" : "#696969";

    const getOpacity = (tenXa?: string) => (tenXa ? 0.2 : 0.4);

    const hoverStyle = () => ({
      weight: 4,
      color: "#f39c12",
      fillOpacity: 0.6,
      text: "bold",
    });

    // ===============================
    // 5. Arrow Marker
    // ===============================
    const createArrowIcon = (color = "#e74c3c") =>
      L.divIcon({
        className: "arrow-marker",
        html: `<div style="border-top-color:${color}"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      });

    // ===============================
    // 6. Load Annotations
    // ===============================
    fetch("/data/annotations.geojson")
      .then((res) => res.json())
      .then((data) => {
        L.geoJSON(data, {
          pointToLayer: (feature, latlng) =>
            L.marker(latlng, {
              icon: createArrowIcon(feature.properties.color),
            }),
          onEachFeature: (feature, layer) => {
            layer.on("click", () => {
              console.log("Annotation:", feature.properties);
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
          color: getColor(data.features[0].properties?.ten_tinh),
          weight: 2,
          fillOpacity: getOpacity(data.features[0].properties?.ten_xa),
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
        if (z >= 6) {
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
  }, []);

  return <div id="map" style={{ width: "80vw", height: "80vh" }} />;
};

export default MapView;
