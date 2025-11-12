import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./RealTimeMap.css";

// Fix cho marker icons - QUAN TRỌNG
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons cho từng trạng thái
const activityIcons = {
  resting: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  walking: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  running: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  playing: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

export default function RealTimeMap({ petData, selectedPet }) {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState(100); // meters
  const mapRef = useRef();

  console.log("Pet Data in Map:", petData);

  useEffect(() => {
    if (
      petData &&
      petData.length > 0 &&
      petData[0].latitude &&
      petData[0].longitude
    ) {
      const latestData = petData[0];
      const newPosition = [latestData.latitude, latestData.longitude];

      console.log("New Position:", newPosition);

      setCurrentPosition(newPosition);
      setPath((prev) => [...prev.slice(-50), newPosition]);

      if (mapRef.current) {
        mapRef.current.setView(newPosition, 16);
      }
    } else {
      const defaultPosition = [10.8231, 106.6297];
      setCurrentPosition(defaultPosition);
      console.log("Using default position:", defaultPosition);
    }
  }, [petData]);

  const handleGeofenceToggle = () => {
    setGeofenceEnabled(!geofenceEnabled);
  };

  const handleRadiusChange = (e) => {
    setGeofenceRadius(parseInt(e.target.value));
  };

  if (!currentPosition) {
    return (
      <div className="map-loading-container">
        <div className="map-loading-content">
          <div className="map-loading-spinner"></div>
          <p className="map-loading-text">Đang chờ dữ liệu vị trí...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Geofence Controls */}
      <div className="geofence-controls">
        <div className="geofence-controls-title">
          🛡️ Vùng An Toàn
        </div>
        
        <div className="geofence-toggle">
          <input
            type="checkbox"
            id="geofence-toggle"
            className="geofence-checkbox"
            checked={geofenceEnabled}
            onChange={handleGeofenceToggle}
          />
          <label htmlFor="geofence-toggle" className="geofence-label">
            Hiển thị Geofence
          </label>
        </div>

        {geofenceEnabled && (
          <div className="geofence-slider-container">
            <label className="geofence-slider-label">
              Bán kính: <span className="geofence-slider-value">{geofenceRadius}m</span>
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
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container">
        <MapContainer
          center={currentPosition}
          zoom={16}
          className="leaflet-map"
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Vẽ đường đi */}
          {path.length > 1 && (
            <Polyline positions={path} color="#3B82F6" weight={4} opacity={0.7} />
          )}

          {/* Marker hiện tại */}
          {currentPosition && (
            <Marker
              position={currentPosition}
              icon={
                activityIcons[petData?.[0]?.activityType] || activityIcons.resting
              }
            >
              <Popup>
                <div className="map-popup">
                  <strong>{selectedPet?.name || "Pet"}</strong>
                  <br />
                  📍 {currentPosition[0].toFixed(6)},{" "}
                  {currentPosition[1].toFixed(6)}
                  <br />
                  🏃 {petData?.[0]?.activityType || "unknown"}
                  <br />⚡ {petData?.[0]?.batteryLevel || "N/A"}%
                  <br />
                  🕐{" "}
                  {petData?.[0]?.timestamp
                    ? new Date(petData[0].timestamp).toLocaleTimeString()
                    : "N/A"}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Vùng an toàn động với animation */}
          {geofenceEnabled && currentPosition && (
            <Circle
              center={currentPosition}
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
        </MapContainer>
      </div>
    </div>
  );
}