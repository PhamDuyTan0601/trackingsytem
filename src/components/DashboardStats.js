import React, { useState, useEffect } from "react";
import "./DashboardStats.css";

export default function DashboardStats({ petData, selectedPet }) {
  const [stats, setStats] = useState({
    lastUpdate: null,
    activityType: "unknown",
    batteryLevel: 0,
    speed: 0,
  });

  useEffect(() => {
    if (petData && petData.length > 0) {
      calculateStats(petData);
    }
  }, [petData]);

  const calculateStats = (data) => {
    const latest = data[0];
    setStats({
      lastUpdate: latest?.timestamp,
      activityType: latest?.activityType || "unknown",
      batteryLevel: latest?.batteryLevel || 0,
      speed: latest?.speed || 0,
    });
  };

  const ActivityBadge = ({ activityType }) => {
    const activityConfig = {
      resting: {
        className: "resting",
        label: "Nghỉ ngơi",
        icon: "😴",
      },
      walking: {
        className: "walking",
        label: "Đang đi",
        icon: "🚶",
      },
      running: {
        className: "running",
        label: "Đang chạy",
        icon: "🏃",
      },
      playing: {
        className: "playing",
        label: "Đang chơi",
        icon: "🎾",
      },
      unknown: {
        className: "unknown",
        label: "Không xác định",
        icon: "❓",
      },
    };

    const config = activityConfig[activityType] || activityConfig.unknown;

    return (
      <div className={`activity-badge ${config.className}`}>
        <span className="activity-badge-icon">{config.icon}</span>
        {config.label}
      </div>
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Chưa có dữ liệu";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN");
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3 className="stat-card-title">Trạng thái hoạt động</h3>
        <div className="stat-card-value">
          <ActivityBadge activityType={stats.activityType} />
        </div>
      </div>

      <div className="stat-card">
        <h3 className="stat-card-title">Mức pin</h3>
        <div className="stat-card-value battery-level">
          {stats.batteryLevel}%
          <div
            className={`battery-indicator ${
              stats.batteryLevel < 20
                ? "low"
                : stats.batteryLevel < 50
                ? "medium"
                : "high"
            }`}
          >
            <div
              className="battery-fill"
              style={{ width: `${stats.batteryLevel}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="stat-card-title">Tốc độ</h3>
        <div className="stat-card-value speed-value">
          {stats.speed.toFixed(1)} m/s
        </div>
      </div>

      <div className="stat-card">
        <h3 className="stat-card-title">Cập nhật lần cuối</h3>
        <div className="stat-card-value">{formatTime(stats.lastUpdate)}</div>
      </div>
    </div>
  );
}
