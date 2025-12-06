import React, { useState, useEffect } from "react";
import {
  getPetsByUser,
  getAllPetData,
  getSafeZones,
  addSafeZone,
  deleteSafeZone,
} from "../api/api";
import Navbar from "../components/Navbar";
import RealTimeMap from "../components/RealTimeMap";
import AlertSystem from "../components/AlertSystem";
import DashboardStats from "../components/DashboardStats";
import "./Dashboard.css";

function Dashboard() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [petData, setPetData] = useState([]);
  const [safeZones, setSafeZones] = useState([]); // THÊM STATE MỚI
  const [loading, setLoading] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [safeZoneCenter, setSafeZoneCenter] = useState(null);
  const [initialPositionSet, setInitialPositionSet] = useState(false);
  const [showAddSafeZone, setShowAddSafeZone] = useState(false);
  const [newSafeZone, setNewSafeZone] = useState({
    name: "Vùng an toàn",
    center: { lat: null, lng: null },
    radius: 100,
  });

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      fetchPetData(selectedPet);
      fetchSafeZones(selectedPet); // THÊM: Lấy safe zones từ backend
    }
  }, [selectedPet]);

  // Lấy tọa độ lần đầu tiên từ ESP32 và cố định
  useEffect(() => {
    if (petData && petData.length > 0 && !initialPositionSet) {
      const validData = petData.find((data) => data.latitude && data.longitude);
      if (validData) {
        // Set tâm vùng an toàn từ dữ liệu đầu tiên và cố định
        setSafeZoneCenter([validData.latitude, validData.longitude]);
        setInitialPositionSet(true);
        console.log(
          "✅ Đã thiết lập tâm vùng an toàn từ dữ liệu ESP32 đầu tiên"
        );
      }
    }
  }, [petData, initialPositionSet]);

  const fetchPets = async () => {
    try {
      const res = await getPetsByUser();
      const userPets = res.data.pets || [];
      setPets(userPets);

      if (userPets.length > 0) {
        setSelectedPet(userPets[0]._id);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pets:", error);
      setLoading(false);
    }
  };

  const fetchPetData = async (petId) => {
    try {
      const res = await getAllPetData(petId);
      const data = res.data.data || [];
      setPetData(data);

      // Reset initial position khi chuyển pet
      setInitialPositionSet(false);
    } catch (error) {
      console.error("Error fetching pet data:", error);
      setPetData([]);
    }
  };

  // THÊM: Hàm lấy safe zones từ backend
  const fetchSafeZones = async (petId) => {
    try {
      const res = await getSafeZones(petId);
      if (res.data.success) {
        setSafeZones(res.data.safeZones || []);
      }
    } catch (error) {
      console.error("Error fetching safe zones:", error);
      setSafeZones([]);
    }
  };

  // THÊM: Hàm thêm safe zone mới
  const handleAddSafeZone = async () => {
    if (!newSafeZone.center.lat || !newSafeZone.center.lng) {
      alert("⚠️ Vui lòng nhập tọa độ cho vùng an toàn!");
      return;
    }

    if (newSafeZone.radius < 10 || newSafeZone.radius > 5000) {
      alert("⚠️ Bán kính phải từ 10m đến 5000m!");
      return;
    }

    try {
      const res = await addSafeZone(selectedPet, newSafeZone);
      if (res.data.success) {
        alert("✅ Đã thêm vùng an toàn!");
        setSafeZones([...safeZones, res.data.safeZone]);
        setShowAddSafeZone(false);
        setNewSafeZone({
          name: "Vùng an toàn",
          center: { lat: null, lng: null },
          radius: 100,
        });
      }
    } catch (error) {
      console.error("Error adding safe zone:", error);
      alert("❌ Lỗi khi thêm vùng an toàn");
    }
  };

  // THÊM: Hàm xóa safe zone
  const handleDeleteSafeZone = async (zoneId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vùng an toàn này?")) return;

    try {
      const res = await deleteSafeZone(selectedPet, zoneId);
      if (res.data.success) {
        alert("✅ Đã xóa vùng an toàn!");
        setSafeZones(safeZones.filter((zone) => zone._id !== zoneId));
      }
    } catch (error) {
      console.error("Error deleting safe zone:", error);
      alert("❌ Lỗi khi xóa vùng an toàn");
    }
  };

  const handleGeofenceRadiusChange = (radius) => {
    setGeofenceRadius(radius);
  };

  // Cho phép reset vùng an toàn nếu cần
  const resetSafeZone = () => {
    if (petData && petData.length > 0) {
      const latestData = petData[0];
      if (latestData.latitude && latestData.longitude) {
        setSafeZoneCenter([latestData.latitude, latestData.longitude]);
        console.log("🔄 Đã reset tâm vùng an toàn");
      }
    }
  };

  // THÊM: Dùng vị trí hiện tại làm tâm safe zone
  const useCurrentLocation = () => {
    const latestData = getLatestPetData();
    if (latestData && latestData.latitude && latestData.longitude) {
      setNewSafeZone({
        ...newSafeZone,
        center: {
          lat: latestData.latitude,
          lng: latestData.longitude,
        },
      });
      alert("✅ Đã lấy vị trí hiện tại làm tâm vùng an toàn!");
    } else {
      alert("⚠️ Chưa có dữ liệu vị trí từ ESP32!");
    }
  };

  const getSelectedPetInfo = () => {
    return pets.find((pet) => pet._id === selectedPet);
  };

  const getLatestPetData = () => {
    return petData && petData.length > 0 ? petData[0] : null;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading">Đang tải dữ liệu...</div>
        </div>
      </>
    );
  }

  if (pets.length === 0) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="no-pets">
            <p>🐾 Bạn chưa có pet nào!</p>
            <button onClick={() => (window.location.href = "/add-pet")}>
              ➕ Thêm Pet Mới
            </button>
          </div>
        </div>
      </>
    );
  }

  const latestData = getLatestPetData();
  const selectedPetInfo = getSelectedPetInfo();

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>🐕 Dashboard Theo Dõi Pet</h2>
          {latestData && (
            <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
              📍 Vị trí hiện tại: {latestData.latitude?.toFixed(6)},{" "}
              {latestData.longitude?.toFixed(6)}
            </div>
          )}
        </div>

        {/* Pet Selector */}
        <div className="pet-selector">
          <label>Chọn Pet để theo dõi:</label>
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
          >
            {pets.map((pet) => (
              <option key={pet._id} value={pet._id}>
                {pet.name} ({pet.species})
              </option>
            ))}
          </select>
        </div>

        {/* Grid Layout: Map và Alerts */}
        <div className="grid-layout">
          {/* Map Section với Geofence Controls */}
          <div className="map-section">
            <h3>
              🗺️ Bản Đồ Theo Dõi
              {safeZoneCenter && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#10b981",
                    marginLeft: "10px",
                  }}
                >
                  (Vùng an toàn: {geofenceRadius}m)
                </span>
              )}
            </h3>

            {/* Nút thêm safe zone */}
            <div
              style={{
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowAddSafeZone(!showAddSafeZone)}
                style={{
                  padding: "0.5rem 1rem",
                  background: showAddSafeZone ? "#ef4444" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {showAddSafeZone ? "✖️ Đóng" : "➕ Thêm Vùng An Toàn"}
              </button>
            </div>

            {/* Form thêm safe zone */}
            {showAddSafeZone && (
              <div
                className="card"
                style={{ marginBottom: "1rem", background: "#f0f9ff" }}
              >
                <h4>📍 Thiết lập Vùng An Toàn Mới</h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    placeholder="Tên vùng an toàn"
                    value={newSafeZone.name}
                    onChange={(e) =>
                      setNewSafeZone({ ...newSafeZone, name: e.target.value })
                    }
                    style={{ padding: "0.5rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      value={newSafeZone.center.lat || ""}
                      onChange={(e) =>
                        setNewSafeZone({
                          ...newSafeZone,
                          center: {
                            ...newSafeZone.center,
                            lat: parseFloat(e.target.value),
                          },
                        })
                      }
                      style={{ flex: 1, padding: "0.5rem" }}
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      value={newSafeZone.center.lng || ""}
                      onChange={(e) =>
                        setNewSafeZone({
                          ...newSafeZone,
                          center: {
                            ...newSafeZone.center,
                            lng: parseFloat(e.target.value),
                          },
                        })
                      }
                      style={{ flex: 1, padding: "0.5rem" }}
                    />
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      placeholder="Bán kính (m)"
                      value={newSafeZone.radius}
                      onChange={(e) =>
                        setNewSafeZone({
                          ...newSafeZone,
                          radius: parseInt(e.target.value),
                        })
                      }
                      style={{ width: "120px", padding: "0.5rem" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={handleAddSafeZone}
                      style={{
                        flex: 1,
                        background: "#3b82f6",
                        padding: "0.5rem",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                      }}
                    >
                      💾 Lưu Vùng An Toàn
                    </button>
                    <button
                      onClick={useCurrentLocation}
                      style={{
                        background: "#10b981",
                        padding: "0.5rem",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      disabled={!latestData}
                    >
                      📍 Dùng Vị Trí Hiện Tại
                    </button>
                  </div>
                </div>
              </div>
            )}

            <RealTimeMap
              petData={petData}
              selectedPet={getSelectedPetInfo()}
              geofenceRadius={geofenceRadius}
              safeZoneCenter={safeZoneCenter}
              safeZones={safeZones} // TRUYỀN SAFE ZONES VÀO MAP
              onGeofenceRadiusChange={handleGeofenceRadiusChange}
              onResetSafeZone={resetSafeZone}
              initialPositionSet={initialPositionSet}
            />
          </div>

          {/* Alerts Section */}
          <div className="alerts-section">
            <h3>⚠️ Cảnh Báo & Thông Báo</h3>
            <AlertSystem
              petData={petData}
              selectedPet={getSelectedPetInfo()}
              geofenceRadius={geofenceRadius}
              safeZoneCenter={safeZoneCenter}
              safeZones={safeZones} // TRUYỀN SAFE ZONES VÀO ALERTS
            />
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ marginBottom: "2rem" }}>
          <DashboardStats
            petData={petData}
            selectedPet={getSelectedPetInfo()}
          />
        </div>

        {/* Safe Zones List */}
        {safeZones.length > 0 && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h3>🛡️ Danh Sách Vùng An Toàn</h3>
              <span
                style={{
                  background: "#10b981",
                  color: "white",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.8rem",
                }}
              >
                {safeZones.length} vùng
              </span>
            </div>

            <div className="devices-list">
              {safeZones.map((zone) => (
                <div
                  key={zone._id}
                  className="device-item"
                  style={{
                    borderLeft: zone.isActive
                      ? "4px solid #10b981"
                      : "4px solid #9ca3af",
                  }}
                >
                  <div className="device-info">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <strong>{zone.name}</strong>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "0.25rem",
                          }}
                        >
                          <span
                            style={{
                              background: zone.isActive ? "#d1fae5" : "#f3f4f6",
                              color: zone.isActive ? "#065f46" : "#6b7280",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                            }}
                          >
                            {zone.isActive
                              ? "🟢 Đang hoạt động"
                              : "⚫ Tạm ngừng"}
                          </span>
                          <span
                            style={{
                              background: "#dbeafe",
                              color: "#1e40af",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.75rem",
                            }}
                          >
                            📏 {zone.radius}m
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: "0.5rem",
                            fontSize: "0.85rem",
                            color: "#4b5563",
                          }}
                        >
                          <div>
                            📍 {zone.center.lat.toFixed(6)},{" "}
                            {zone.center.lng.toFixed(6)}
                          </div>
                          {zone.createdAt && (
                            <div>
                              📅 Tạo:{" "}
                              {new Date(zone.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSafeZone(zone._id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "0.25rem",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                        title="Xóa vùng an toàn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pet List Section */}
        <div className="pet-list-section">
          <div className="section-header">
            <h3>📋 Danh Sách Pets Của Bạn</h3>
            <small>Tổng: {pets.length} pet</small>
          </div>

          <div className="pets-grid">
            {pets.map((pet) => (
              <div
                key={pet._id}
                className={`pet-card ${
                  selectedPet === pet._id ? "active" : ""
                }`}
                onClick={() => setSelectedPet(pet._id)}
              >
                <div className="pet-info">
                  <h4>{pet.name}</h4>
                  <p>🐾 {pet.species}</p>
                  <p>🎂 {pet.age} tuổi</p>
                  <p>🏷️ {pet.breed}</p>
                  {selectedPet === pet._id && latestData && (
                    <div className="pet-status">
                      <div className="status-dot"></div>
                      <span>
                        {latestData.activityType === "resting"
                          ? "Đang nghỉ"
                          : latestData.activityType === "walking"
                          ? "Đang đi"
                          : latestData.activityType === "running"
                          ? "Đang chạy"
                          : "Đang theo dõi"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thông tin vùng an toàn cố định */}
        {safeZoneCenter && (
          <div
            className="card"
            style={{ marginTop: "1.5rem", background: "#f0f9ff" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h4>🛡️ Vùng An Toàn Cố Định (ESP32)</h4>
              <button
                onClick={resetSafeZone}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                🔄 Reset Vùng
              </button>
            </div>
            <p>
              <strong>🎯 Tâm vùng an toàn:</strong>{" "}
              {safeZoneCenter[0].toFixed(6)}, {safeZoneCenter[1].toFixed(6)}
            </p>
            <p>
              <strong>📏 Bán kính:</strong> {geofenceRadius} mét
            </p>
            <p>
              <strong>📡 Nguồn dữ liệu:</strong> ESP32 (lần đầu kết nối)
            </p>
            <p>
              <strong>🔒 Trạng thái:</strong>{" "}
              {initialPositionSet ? "✅ Đã cố định" : "🔄 Đang chờ dữ liệu"}
            </p>
            <small style={{ color: "#6b7280" }}>
              Vùng an toàn được thiết lập từ vị trí đầu tiên nhận được từ ESP32
              và giữ cố định. ESP32 sẽ nhận được vị trí này để cảnh báo khi pet
              ra khỏi vùng.
            </small>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
