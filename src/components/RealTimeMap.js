import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./RealTimeMap.css";

// 🚨 FIX: Import icon images cho Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

// 🚨 FIX: Cấu hình đúng cho Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: icon2x,
  iconUrl: icon,
  shadowUrl: shadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icons cho các hoạt động
const activityIcons = {
  resting: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  walking: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  running: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  playing: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

// Component để cập nhật map view
function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && map) {
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);

  return null;
}

// Component hiển thị Safe Zone từ database
function DatabaseSafeZone({ safeZones = [] }) {
  // Lưu safe zones vào localStorage
  useEffect(() => {
    if (safeZones && safeZones.length > 0) {
      try {
        localStorage.setItem("petSafeZones", JSON.stringify(safeZones));
        console.log(`💾 Saved ${safeZones.length} safe zones to localStorage`);
      } catch (error) {
        console.error("❌ Error saving to localStorage:", error);
      }
    }
  }, [safeZones]);

  if (!safeZones || safeZones.length === 0) return null;

  return (
    <>
      {safeZones.map((zone, index) => {
        if (!zone.center || !zone.center.lat || !zone.center.lng) return null;

        const zoneCenter = [zone.center.lat, zone.center.lng];
        const zoneRadius = zone.radius || 100;
        const isActive = zone.isActive !== false;
        const isPrimary = zone.isPrimary === true;

        // Màu sắc dựa trên trạng thái
        let zoneColor = isPrimary ? "#3B82F6" : "#10B981";
        let fillColor = isPrimary ? "#3B82F6" : "#10B981";

        if (!isActive) {
          zoneColor = "#6B7280";
          fillColor = "#6B7280";
        }

        return (
          <React.Fragment key={zone._id || index}>
            <Circle
              center={zoneCenter}
              radius={zoneRadius}
              pathOptions={{
                color: zoneColor,
                fillColor: fillColor,
                fillOpacity: isActive ? 0.2 : 0.1,
                weight: isActive ? 3 : 2,
                dashArray: isPrimary ? "10, 10" : "5, 5",
                className: "safezone-db",
              }}
            />
            {/* Marker tâm safe zone */}
            <Marker
              position={zoneCenter}
              icon={
                new L.DivIcon({
                  html: `<div class="safe-zone-center-marker" style="background: ${zoneColor}">${
                    isPrimary ? "P" : isActive ? "A" : "I"
                  }</div>`,
                  className: "safe-zone-center-marker-container",
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })
              }
            >
              <Popup>
                <div className="safe-zone-popup">
                  <strong>🏠 Vùng An Toàn</strong>
                  <br />
                  <strong>Tên:</strong> {zone.name || "Vùng an toàn"}
                  <br />
                  <strong>Bán kính:</strong> {zoneRadius}m
                  <br />
                  <strong>Loại:</strong> {isPrimary ? "Chính" : "Thường"}
                  <br />
                  <strong>Trạng thái:</strong>{" "}
                  {isActive ? "🟢 Đang hoạt động" : "⚪ Tạm ngưng"}
                  <br />
                  {zone.notes && (
                    <>
                      <strong>Ghi chú:</strong> {zone.notes}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}

// Component hiển thị vị trí đầu tiên
function FirstLocationMarker({ firstLocation }) {
  if (!firstLocation) return null;

  return (
    <Marker
      position={[firstLocation.lat, firstLocation.lng]}
      icon={
        new L.DivIcon({
          html: `<div class="first-location-marker">🚩</div>`,
          className: "first-location-marker-container",
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        })
      }
    >
      <Popup>
        <div className="first-location-popup">
          <strong>🚩 Vị trí đầu tiên</strong>
          <br />
          <strong>Tọa độ:</strong> {firstLocation.lat.toFixed(6)},{" "}
          {firstLocation.lng.toFixed(6)}
          <br />
          <strong>Thời gian:</strong>{" "}
          {firstLocation.timestamp
            ? new Date(firstLocation.timestamp).toLocaleString("vi-VN")
            : "N/A"}
        </div>
      </Popup>
    </Marker>
  );
}

// Component chính
export default function RealTimeMap({
  petData,
  selectedPet,
  safeZones = [],
  activeSafeZoneId = null,
  showPath = true,
  firstLocation = null,
  currentRadius = 100,
}) {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [pathVisible, setPathVisible] = useState(showPath);
  const [cachedSafeZones, setCachedSafeZones] = useState([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef();

  // Khôi phục safe zones từ localStorage khi reload
  useEffect(() => {
    try {
      const savedZones = localStorage.getItem("petSafeZones");
      if (savedZones) {
        const parsedZones = JSON.parse(savedZones);
        setCachedSafeZones(parsedZones);
        console.log(
          `💾 Restored ${parsedZones.length} safe zones from localStorage`
        );
      }
    } catch (error) {
      console.error("❌ Error restoring from localStorage:", error);
    }
  }, []);

  // Cập nhật path visibility khi prop thay đổi
  useEffect(() => {
    setPathVisible(showPath);
  }, [showPath]);

  // Ưu tiên dùng safe zones từ props (database), nếu không có thì dùng cached
  const displaySafeZones = safeZones.length > 0 ? safeZones : cachedSafeZones;

  // Xử lý dữ liệu từ ESP32 để tạo đường đi
  useEffect(() => {
    if (petData && petData.length > 0) {
      const latestData = petData[0];
      if (latestData.latitude && latestData.longitude) {
        const newPosition = [latestData.latitude, latestData.longitude];
        setCurrentPosition(newPosition);

        const newPath = petData
          .filter((item) => item.latitude && item.longitude)
          .map((item) => [item.latitude, item.longitude])
          .reverse();

        const maxPoints = 100;
        if (newPath.length > maxPoints) {
          const step = Math.floor(newPath.length / maxPoints);
          const limitedPath = [];
          for (let i = 0; i < newPath.length; i += step) {
            limitedPath.push(newPath[i]);
          }
          setPath(limitedPath);
        } else {
          setPath(newPath);
        }
      }
    }
  }, [petData]);

  // Đánh dấu map đã sẵn sàng
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const renderPathMarkers = () => {
    if (!pathVisible || path.length === 0) return null;

    return path.map((point, index) => {
      if (index % 5 !== 0 && index !== path.length - 1) return null;

      const timeIndex = petData.length - index - 1;
      const dataPoint = petData[timeIndex];

      return (
        <Marker
          key={`path-${index}`}
          position={point}
          icon={
            new L.DivIcon({
              html: `<div class="path-point">${index + 1}</div>`,
              className: "path-point-marker",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })
          }
        >
          <Popup>
            <div className="path-popup">
              <strong>📍 Điểm #{index + 1}</strong>
              <br />
              <strong>Thời gian:</strong>{" "}
              {dataPoint?.timestamp
                ? new Date(dataPoint.timestamp).toLocaleTimeString("vi-VN")
                : "N/A"}
              <br />
              {dataPoint?.speed && (
                <>
                  <strong>Tốc độ:</strong> {dataPoint.speed.toFixed(1)} m/s
                </>
              )}
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  const getLatestData = () => {
    return petData && petData.length > 0 ? petData[0] : null;
  };

  const latestData = getLatestData();

  // Lấy vị trí center để hiển thị
  let displayPosition = currentPosition;

  // Nếu không có vị trí hiện tại, thử lấy từ safe zones
  if (!displayPosition && displaySafeZones.length > 0) {
    const primaryZone =
      displaySafeZones.find((z) => z.isPrimary) || displaySafeZones[0];
    if (primaryZone.center) {
      displayPosition = [primaryZone.center.lat, primaryZone.center.lng];
    }
  }

  // Mặc định nếu không có gì
  if (!displayPosition) {
    displayPosition = [21.0285, 105.8542]; // Tọa độ mặc định Hà Nội
  }

  // Nếu vẫn không có dữ liệu và map chưa ready, hiển thị loading
  if (!isMapReady || (!currentPosition && displaySafeZones.length === 0)) {
    return (
      <div className="map-loading-container">
        <div className="map-loading-content">
          <div className="map-loading-spinner"></div>
          <p className="map-loading-text">Đang tải bản đồ...</p>
          <small style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            {displaySafeZones.length > 0
              ? `Đã khôi phục ${displaySafeZones.length} vùng an toàn`
              : "Đang chờ dữ liệu từ ESP32..."}
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="realtime-map-container">
      {/* Control Panel */}
      <div className="map-controls">
        <div className="control-group">
          <button
            className={`control-btn ${pathVisible ? "active" : ""}`}
            onClick={() => setPathVisible(!pathVisible)}
            title="Ẩn/Hiện đường đi"
          >
            {pathVisible ? "🗺️ Ẩn đường đi" : "🗺️ Hiện đường đi"}
          </button>
          <div className="safe-zone-info">
            <small>
              🏠 Safe Zones: {displaySafeZones.filter((z) => z.isActive).length}{" "}
              active
              {cachedSafeZones.length > 0 &&
                safeZones.length === 0 &&
                " (from cache)"}
            </small>
          </div>
        </div>
      </div>

      {/* Bản đồ */}
      <div className="map-container">
        <MapContainer
          center={displayPosition}
          zoom={16}
          className="leaflet-map"
          ref={mapRef}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <MapUpdater center={displayPosition} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Đường đi từ ESP32 */}
          {pathVisible && path.length > 1 && (
            <Polyline
              positions={path}
              pathOptions={{
                color: "#3B82F6",
                weight: 4,
                opacity: 0.7,
                dashArray: "5, 10",
              }}
            />
          )}

          {/* Marker cho từng điểm trên đường đi */}
          {pathVisible && renderPathMarkers()}

          {/* Hiển thị vị trí đầu tiên */}
          {firstLocation && (
            <FirstLocationMarker firstLocation={firstLocation} />
          )}

          {/* Hiển thị Safe Zones */}
          <DatabaseSafeZone safeZones={displaySafeZones} />

          {/* Marker vị trí hiện tại ESP32 */}
          {currentPosition && (
            <Marker
              position={currentPosition}
              icon={
                activityIcons[latestData?.activityType] || activityIcons.resting
              }
            >
              <Popup>
                <div className="map-popup">
                  <strong>
                    📍 {selectedPet?.name || "Pet"} - Vị trí hiện tại
                  </strong>
                  <br />
                  <strong>🏃 Hoạt động:</strong>{" "}
                  {latestData?.activityType || "unknown"}
                  <br />
                  <strong>⚡ Pin:</strong> {latestData?.batteryLevel || "N/A"}%
                  <br />
                  <strong>⏰ Thời gian:</strong>{" "}
                  {latestData?.timestamp
                    ? new Date(latestData.timestamp).toLocaleTimeString("vi-VN")
                    : "N/A"}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
