import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import "./AlertSystem.css";

export default function AlertSystem({
  petData,
  selectedPet,
  safeZones = [], // ĐÃ SỬA: nhận array safe zones
}) {
  const [alerts, setAlerts] = useState([]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  const checkAlerts = useCallback(
    (latestData) => {
      const newAlerts = [];

      // Check battery

      // 🚨 FIXED: Check all safe zones (not just one)
      if (safeZones.length > 0 && latestData.latitude && latestData.longitude) {
        let isInAnyZone = false;
        let nearestZone = null;
        let minDistance = Infinity;

        // Kiểm tra tất cả safe zones
        safeZones.forEach((zone) => {
          if (
            zone.isActive &&
            zone.center &&
            zone.center.lat &&
            zone.center.lng
          ) {
            const distance = calculateDistance(
              zone.center.lat,
              zone.center.lng,
              latestData.latitude,
              latestData.longitude
            );

            if (distance < minDistance) {
              minDistance = distance;
              nearestZone = zone;
            }

            if (distance <= zone.radius) {
              isInAnyZone = true;
            }
          }
        });

        // Nếu ra khỏi TẤT CẢ safe zones active
        if (!isInAnyZone && nearestZone) {
          newAlerts.push({
            type: "geofence",
            message: ` ${selectedPet?.name || "Pet"} đã ra khỏi vùng an toàn "${
              nearestZone.name
            }"! (${minDistance.toFixed(0)}m)`,
            level: "danger",
          });
        }
      }

      // Check activity alerts
      if (latestData.activityType === "running") {
        newAlerts.push({
          type: "activity",
          message: `Đang chạy nhanh!`,
          level: "info",
        });
      }

      newAlerts.forEach((alert) => {
        if (
          !alerts.find(
            (a) => a.type === alert.type && a.message === alert.message
          )
        ) {
          toast[
            alert.level === "danger"
              ? "error"
              : alert.level === "warning"
              ? "warning"
              : "info"
          ](alert.message);
          setAlerts((prev) => [
            ...prev,
            { ...alert, id: Date.now(), timestamp: new Date() },
          ]);
        }
      });
    },
    [alerts, safeZones, selectedPet]
  );

  useEffect(() => {
    if (petData && petData.length > 0) {
      checkAlerts(petData[0]);
    }
  }, [petData, checkAlerts]);

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="alert-system-container">
      <h2 className="alert-system-title"> Cảnh Báo & Thông Báo</h2>

      {alerts.length === 0 ? (
        <div className="alert-empty-state">
          <div className="alert-empty-icon"></div>
          <p>Không có cảnh báo nào</p>
          <p className="alert-empty-subtitle">Mọi thứ đều ổn định</p>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.level}`}>
              <div className="alert-content">
                <div>
                  <p className="alert-message">{alert.message}</p>
                  <p className="alert-time">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="alert-close-btn"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
