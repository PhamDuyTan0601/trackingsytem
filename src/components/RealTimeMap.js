import { useState, useEffect, useRef } from "react";
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

// Fix cho marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const activityIcons = {
  resting: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  walking: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  running: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);

  return null;
}

export default function RealTimeMap({
  petData,
  selectedPet,
  geofenceRadius,
  safeZoneCenter,
  onGeofenceRadiusChange,
  onResetSafeZone,
  initialPositionSet,
}) {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const mapRef = useRef();

  useEffect(() => {
    if (
      petData &&
      petData.length > 0 &&
      petData[0].latitude &&
      petData[0].longitude
    ) {
      const latestData = petData[0];
      const newPosition = [latestData.latitude, latestData.longitude];
      setCurrentPosition(newPosition);
      setPath((prev) => [...prev.slice(-50), newPosition]);
    }
  }, [petData]);

  const handleGeofenceToggle = () => {
    setGeofenceEnabled(!geofenceEnabled);
  };

  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    onGeofenceRadiusChange(newRadius);
  };

  const getLatestData = () => {
    return petData && petData.length > 0 ? petData[0] : null;
  };

  const latestData = getLatestData();

  if (!currentPosition && !safeZoneCenter) {
    return (
      <div className="map-loading-container">
        <div className="map-loading-content">
          <div className="map-loading-spinner"></div>
          <p className="map-loading-text">Đang chờ dữ liệu từ ESP32...</p>
          <small style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            Đang chờ vị trí đầu tiên để thiết lập vùng an toàn
          </small>
        </div>
      </div>
    );
  }

  const displayPosition = currentPosition || safeZoneCenter;

  return (
    <div style={{ position: "relative" }}>
      {/* Geofence Controls */}
      <div className="geofence-controls">
        <div className="geofence-controls-title">🛡️ Vùng An Toàn</div>

        {safeZoneCenter && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#059669",
              marginBottom: "10px",
              padding: "8px",
              background: "#d1fae5",
              borderRadius: "4px",
              border: "1px solid #10b981",
            }}
          >
            <div>
              <strong>🎯 Tâm đã cố định</strong>
            </div>
            <div>
              📍 {safeZoneCenter[0].toFixed(4)}, {safeZoneCenter[1].toFixed(4)}
            </div>
          </div>
        )}

        {latestData && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginBottom: "10px",
              padding: "5px",
              background: "#f3f4f6",
              borderRadius: "4px",
            }}
          >
            <div>📡 ESP32 Live:</div>
            <div>⚡ Pin: {latestData.batteryLevel || "N/A"}%</div>
            <div>🏃 {latestData.activityType || "unknown"}</div>
            <div>
              🕐{" "}
              {latestData.timestamp
                ? new Date(latestData.timestamp).toLocaleTimeString()
                : "N/A"}
            </div>
          </div>
        )}

        <div className="geofence-toggle">
          <input
            type="checkbox"
            id="geofence-toggle"
            className="geofence-checkbox"
            checked={geofenceEnabled}
            onChange={handleGeofenceToggle}
          />
          <label htmlFor="geofence-toggle" className="geofence-label">
            Hiển thị vùng an toàn
          </label>
        </div>

        {geofenceEnabled && (
          <div className="geofence-slider-container">
            <label className="geofence-slider-label">
              Bán kính:{" "}
              <span className="geofence-slider-value">{geofenceRadius}m</span>
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={geofenceRadius}
              onChange={handleRadiusChange}
              className="geofence-slider"
            />
            <div
              style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "5px" }}
            >
              Điều chỉnh phạm vi an toàn
            </div>
          </div>
        )}

        {safeZoneCenter && (
          <button
            onClick={onResetSafeZone}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "10px",
              background: "#fbbf24",
              color: "#92400e",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            🔄 Đặt lại tâm vùng
          </button>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container">
        <MapContainer
          center={displayPosition}
          zoom={16}
          className="leaflet-map"
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <MapUpdater center={displayPosition} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Vẽ đường đi từ ESP32 */}
          {path.length > 1 && (
            <Polyline
              positions={path}
              color="#3B82F6"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Marker vị trí hiện tại từ ESP32 */}
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
                    📡 {selectedPet?.name || "Pet"} - Vị trí hiện tại
                  </strong>
                  <br />
                  <strong>📍 Tọa độ:</strong>
                  <br />
                  {currentPosition[0].toFixed(6)},{" "}
                  {currentPosition[1].toFixed(6)}
                  <br />
                  <strong>🏃 Hoạt động:</strong>{" "}
                  {latestData?.activityType || "unknown"}
                  <br />
                  <strong>⚡ Pin:</strong> {latestData?.batteryLevel || "N/A"}%
                  <br />
                  <small style={{ color: "#3b82f6", fontStyle: "italic" }}>
                    Dữ liệu thời gian thực từ ESP32
                  </small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Vùng an toàn cố định từ vị trí đầu tiên */}
          {geofenceEnabled && safeZoneCenter && (
            <Circle
              center={safeZoneCenter}
              radius={geofenceRadius}
              pathOptions={{
                color: "#10B981",
                fillColor: "#10B981",
                fillOpacity: 0.15,
                weight: 3,
                className: "geofence-animated",
              }}
            />
          )}

          {/* Marker tâm vùng an toàn cố định */}
          {geofenceEnabled && safeZoneCenter && (
            <Marker
              position={safeZoneCenter}
              icon={
                new L.Icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
                  shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })
              }
            >
              <Popup>
                <div className="map-popup">
                  <strong>🎯 Tâm vùng an toàn (Cố định)</strong>
                  <br />
                  <strong>📍 Tọa độ:</strong>
                  <br />
                  {safeZoneCenter[0].toFixed(6)}, {safeZoneCenter[1].toFixed(6)}
                  <br />
                  <strong>📏 Bán kính:</strong> {geofenceRadius}m
                  <br />
                  <small style={{ color: "#d97706", fontStyle: "italic" }}>
                    Thiết lập từ vị trí ESP32 đầu tiên
                  </small>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
