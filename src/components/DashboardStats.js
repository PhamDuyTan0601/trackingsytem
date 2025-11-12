import { useState, useEffect } from "react";
import "./DashboardStats.css";

export default function DashboardStats({ petData, selectedPet }) {
  const [stats, setStats] = useState({
    lastUpdate: null,
    activityType: "unknown",
  });

  useEffect(() => {
    if (petData && petData.length > 0) {
      calculateStats(petData);
    }
  }, [petData]);

  const calculateStats = (data) => {
    setStats({
      lastUpdate: data[0]?.timestamp,
      activityType: data[0]?.activityType || "unknown",
    });
  };

  const ActivityBadge = ({ activityType }) => {
    const activityConfig = {
      resting: {
        className: "resting",
        label: "Nghỉ ngơi",
      },
      walking: {
        className: "walking",
        label: "Đang đi",
      },
      running: {
        className: "running",
        label: "Đang chạy",
      },
      unknown: {
        className: "unknown",
        label: "Không xác định",
      },
    };

    const config = activityConfig[activityType] || activityConfig.unknown;

    return (
      <div className={`activity-badge ${config.className}`}>
        {config.label}
      </div>
    );
  };

  return (
    <div className="stat-card purple-border">
      <div className="stat-card-content">
        <div>
          <h3 className="stat-card-title">Trạng thái</h3>
          <div style={{ marginTop: "0.5rem" }}>
            <ActivityBadge activityType={stats.activityType} />
          </div>
        </div>
      </div>
    </div>
  );
}