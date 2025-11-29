import React, { useState, useEffect } from "react";
import { getPetsByUser, getAllPetData } from "../api/api";
import Navbar from "../components/Navbar";
import RealTimeMap from "../components/RealTimeMap";
import AlertSystem from "../components/AlertSystem";
import DashboardStats from "../components/DashboardStats";
import "./Dashboard.css";

function Dashboard() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [petData, setPetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [safeZoneCenter, setSafeZoneCenter] = useState(null);
  const [initialPositionSet, setInitialPositionSet] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      fetchPetData(selectedPet);
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
            <RealTimeMap
              petData={petData}
              selectedPet={getSelectedPetInfo()}
              geofenceRadius={geofenceRadius}
              safeZoneCenter={safeZoneCenter}
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

        {/* Thông tin vùng an toàn */}
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
              <h4>🛡️ Thông Tin Vùng An Toàn</h4>
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
              và giữ cố định
            </small>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
