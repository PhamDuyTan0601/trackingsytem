import React, { useState, useEffect } from "react";
import {
  getPetsByUser,
  getAllPetData,
  getSafeZones,
  updateSafeZone,
  deleteSafeZone,
} from "../api/api";
import Navbar from "../components/Navbar";
import RealTimeMap from "../components/RealTimeMap";
import AlertSystem from "../components/AlertSystem";
import { toast } from "react-toastify";
import "./Dashboard.css";

function Dashboard() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [petData, setPetData] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoCreateDone, setAutoCreateDone] = useState(false);
  const [activeSafeZoneId, setActiveSafeZoneId] = useState(null);
  const [showPath, setShowPath] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [dataTimeRange, setDataTimeRange] = useState({
    start: null,
    end: null,
  });

  // Thêm state cho radius control
  const [radius, setRadius] = useState(100);
  const [isUpdatingRadius, setIsUpdatingRadius] = useState(false);
  const [isCleaningOldZones, setIsCleaningOldZones] = useState(false);

  // 🚨 THÊM: State cho offline mode
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usingCachedData, setUsingCachedData] = useState(false);

  // 🚨 THÊM: Khôi phục trạng thái từ localStorage khi component mount
  useEffect(() => {
    // Kiểm tra trạng thái mạng
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Khôi phục selectedPet từ localStorage
    const savedSelectedPetId = localStorage.getItem("selectedPetId");
    if (savedSelectedPetId) {
      console.log(`💾 Khôi phục pet đã chọn từ cache: ${savedSelectedPetId}`);
    }

    // Khôi phục radius từ localStorage
    const savedRadius = localStorage.getItem("radius");
    if (savedRadius) {
      setRadius(parseInt(savedRadius));
    }

    // Khôi phục showPath từ localStorage
    const savedShowPath = localStorage.getItem("showPath");
    if (savedShowPath !== null) {
      setShowPath(savedShowPath === "true");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 🚨 THÊM: Lưu trạng thái vào localStorage khi thay đổi
  useEffect(() => {
    if (selectedPet) {
      localStorage.setItem("selectedPetId", selectedPet);
    }
  }, [selectedPet]);

  useEffect(() => {
    localStorage.setItem("radius", radius.toString());
  }, [radius]);

  useEffect(() => {
    localStorage.setItem("showPath", showPath.toString());
  }, [showPath]);

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      fetchPetData(selectedPet);
      fetchSafeZones(selectedPet);
      startAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [selectedPet]);

  // Tự động tạo safe zone khi ESP32 gửi vị trí đầu tiên
  useEffect(() => {
    if (
      petData &&
      petData.length > 0 &&
      selectedPet &&
      !autoCreateDone &&
      safeZones.length === 0
    ) {
      const latestData = petData[0];
      if (latestData.latitude && latestData.longitude) {
        createAutoSafeZone(latestData.latitude, latestData.longitude);
      }
    }
  }, [petData, selectedPet, autoCreateDone, safeZones]);

  // Xóa tất cả safe zones cũ trừ cái hiện tại
  useEffect(() => {
    if (safeZones.length > 1) {
      cleanupOldSafeZones();
    }
  }, [safeZones]);

  // Auto refresh dữ liệu mỗi 30 giây
  const startAutoRefresh = () => {
    if (selectedPet) {
      const interval = setInterval(() => {
        if (!isFetchingData && isOnline) {
          // 🚨 Chỉ refresh khi online
          fetchPetData(selectedPet);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  };

  const stopAutoRefresh = () => {
    // Cleanup sẽ được thực hiện trong useEffect
  };

  const fetchPets = async () => {
    try {
      // 🚨 THÊM: Thử load từ cache trước
      const cachedPets = localStorage.getItem("cachedPets");
      if (cachedPets && !isOnline) {
        console.log("📦 Sử dụng dữ liệu pets từ cache (offline mode)");
        const userPets = JSON.parse(cachedPets);
        setPets(userPets);

        if (userPets.length > 0) {
          const savedPetId = localStorage.getItem("selectedPetId");
          const petId =
            savedPetId && userPets.some((p) => p._id === savedPetId)
              ? savedPetId
              : userPets[0]._id;
          setSelectedPet(petId);
        }
        setLoading(false);
        setUsingCachedData(true);
        return;
      }

      const res = await getPetsByUser();
      const userPets = res.data.pets || [];
      setPets(userPets);

      // 🚨 THÊM: Lưu vào cache
      localStorage.setItem("cachedPets", JSON.stringify(userPets));

      if (userPets.length > 0) {
        const savedPetId = localStorage.getItem("selectedPetId");
        const petId =
          savedPetId && userPets.some((p) => p._id === savedPetId)
            ? savedPetId
            : userPets[0]._id;
        setSelectedPet(petId);
      }
      setLoading(false);
      setUsingCachedData(false);
    } catch (error) {
      console.error("Error fetching pets:", error);

      // 🚨 THÊM: Thử load từ cache nếu API fail
      const cachedPets = localStorage.getItem("cachedPets");
      if (cachedPets) {
        console.log("⚠️ API failed, using cached pets");
        const userPets = JSON.parse(cachedPets);
        setPets(userPets);

        if (userPets.length > 0) {
          const savedPetId = localStorage.getItem("selectedPetId");
          const petId =
            savedPetId && userPets.some((p) => p._id === savedPetId)
              ? savedPetId
              : userPets[0]._id;
          setSelectedPet(petId);
        }
        setUsingCachedData(true);
      } else {
        toast.error("Không thể tải danh sách pet!");
      }
      setLoading(false);
    }
  };

  const fetchPetData = async (petId, forceRefresh = false) => {
    if (isFetchingData && !forceRefresh) return;

    // 🚨 THÊM: Nếu offline, load từ cache
    if (!isOnline && !forceRefresh) {
      console.log("📦 Offline mode - loading pet data from cache");
      const cachedPetData = localStorage.getItem(`cachedPetData_${petId}`);
      if (cachedPetData) {
        const data = JSON.parse(cachedPetData);
        const sortedData = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setPetData(sortedData);
        updateTimeRange(sortedData);
        setUsingCachedData(true);
        toast.info("📦 Đang sử dụng dữ liệu cached (offline mode)");
      }
      return;
    }

    setIsFetchingData(true);
    try {
      const res = await getAllPetData(petId);
      const data = res.data.data || [];

      // Sort by timestamp descending (newest first)
      const sortedData = data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setPetData(sortedData);

      // 🚨 THÊM: Lưu vào cache
      localStorage.setItem(
        `cachedPetData_${petId}`,
        JSON.stringify(sortedData)
      );

      // Update time range
      updateTimeRange(sortedData);

      if (forceRefresh) {
        toast.info(`🔄 Đã cập nhật ${sortedData.length} điểm dữ liệu`);
      }
      setUsingCachedData(false);
    } catch (error) {
      console.error("Error fetching pet data:", error);

      // 🚨 THÊM: Thử load từ cache nếu API fail
      const cachedPetData = localStorage.getItem(`cachedPetData_${petId}`);
      if (cachedPetData) {
        console.log("⚠️ API failed, using cached pet data");
        const data = JSON.parse(cachedPetData);
        const sortedData = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setPetData(sortedData);
        updateTimeRange(sortedData);
        setUsingCachedData(true);
        toast.warning("⚠️ Đang sử dụng dữ liệu cũ (không thể kết nối server)");
      } else {
        toast.error("Không thể tải dữ liệu vị trí!");
      }
    } finally {
      setIsFetchingData(false);
    }
  };

  // 🚨 THÊM: Helper function để update time range
  const updateTimeRange = (sortedData) => {
    if (sortedData.length > 0) {
      setDataTimeRange({
        start: sortedData[sortedData.length - 1]?.timestamp,
        end: sortedData[0]?.timestamp,
      });
    }
  };

  const fetchSafeZones = async (petId) => {
    try {
      // 🚨 THÊM: Thử load từ cache trước
      const cachedSafeZones = localStorage.getItem(`cachedSafeZones_${petId}`);
      if (cachedSafeZones && !isOnline) {
        console.log("📦 Offline mode - loading safe zones from cache");
        const zones = JSON.parse(cachedSafeZones);
        processSafeZones(zones);
        setUsingCachedData(true);
        return;
      }

      const res = await getSafeZones(petId);
      if (res.data.success) {
        const zones = res.data.safeZones || [];

        // 🚨 THÊM: Lưu vào cache
        localStorage.setItem(`cachedSafeZones_${petId}`, JSON.stringify(zones));

        processSafeZones(zones);
        setUsingCachedData(false);
      }
    } catch (error) {
      console.error("Error fetching safe zones:", error);

      // 🚨 THÊM: Thử load từ cache nếu API fail
      const cachedSafeZones = localStorage.getItem(`cachedSafeZones_${petId}`);
      if (cachedSafeZones) {
        console.log("⚠️ API failed, using cached safe zones");
        const zones = JSON.parse(cachedSafeZones);
        processSafeZones(zones);
        setUsingCachedData(true);
      } else {
        setSafeZones([]);
      }
    }
  };

  // 🚨 THÊM: Helper function để xử lý safe zones
  const processSafeZones = (zones) => {
    // Chỉ lấy safe zone mới nhất (tự động tạo)
    const autoCreatedZones = zones.filter((zone) => zone.autoCreated);

    if (autoCreatedZones.length > 0) {
      // Lấy zone mới nhất
      const latestZone = autoCreatedZones.reduce((latest, current) => {
        return new Date(current.createdAt) > new Date(latest.createdAt)
          ? current
          : latest;
      }, autoCreatedZones[0]);

      setSafeZones([latestZone]);
      setAutoCreateDone(true);
      setActiveSafeZoneId(latestZone._id);
      setRadius(latestZone.radius || 100);
    } else {
      setSafeZones(zones);

      if (zones.length > 0) {
        setAutoCreateDone(true);
        setActiveSafeZoneId(zones[0]._id);
        setRadius(zones[0].radius || 100);
      }
    }
  };

  // Xóa tất cả safe zones cũ
  const cleanupOldSafeZones = async () => {
    if (!selectedPet || safeZones.length <= 1) return;

    setIsCleaningOldZones(true);
    try {
      const currentZoneId = activeSafeZoneId;
      const zonesToDelete = safeZones.filter(
        (zone) => zone._id !== currentZoneId
      );

      for (const zone of zonesToDelete) {
        await deleteSafeZone(selectedPet, zone._id);
      }

      // Chỉ giữ lại zone hiện tại
      const currentZone = safeZones.find((zone) => zone._id === currentZoneId);
      if (currentZone) {
        setSafeZones([currentZone]);
        // 🚨 THÊM: Cập nhật cache
        localStorage.setItem(
          `cachedSafeZones_${selectedPet}`,
          JSON.stringify([currentZone])
        );
      }

      toast.success(`🧹 Đã dọn dẹp ${zonesToDelete.length} vùng an toàn cũ`);
    } catch (error) {
      console.error("Error cleaning up old safe zones:", error);
      toast.error("❌ Không thể dọn dẹp vùng an toàn cũ");
    } finally {
      setIsCleaningOldZones(false);
    }
  };

  // Tự động tạo safe zone từ ESP32
  const createAutoSafeZone = async (lat, lng) => {
    try {
      console.log("🚀 Tự động tạo safe zone từ ESP32:", { lat, lng });

      const petName = pets.find((p) => p._id === selectedPet)?.name || "Pet";

      const response = await fetch(
        `https://pettracking2.onrender.com/api/pets/${selectedPet}/safe-zones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: `Vùng an toàn ${petName} (Tự động tạo)`,
            center: { lat, lng },
            radius: 100, // Radius mặc định
            autoCreated: true,
            isPrimary: true,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.safeZone) {
        console.log("✅ Đã tự động tạo safe zone:", data.safeZone);
        setSafeZones([data.safeZone]);
        setAutoCreateDone(true);
        setActiveSafeZoneId(data.safeZone._id);
        setRadius(data.safeZone.radius || 100);

        // 🚨 THÊM: Lưu vào cache
        localStorage.setItem(
          `cachedSafeZones_${selectedPet}`,
          JSON.stringify([data.safeZone])
        );

        toast.success(`✅ Đã tạo vùng an toàn cho ${petName}`);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tự động tạo safe zone:", error);
      toast.error("❌ Không thể tạo vùng an toàn (offline mode)");
    }
  };

  // Cập nhật radius của safe zone
  const updateRadius = async () => {
    if (!activeSafeZoneId || !selectedPet) {
      toast.error("Không có safe zone để cập nhật!");
      return;
    }

    setIsUpdatingRadius(true);
    try {
      await updateSafeZone(selectedPet, activeSafeZoneId, { radius });

      // Cập nhật local state
      const updatedZones = safeZones.map((zone) =>
        zone._id === activeSafeZoneId ? { ...zone, radius } : zone
      );
      setSafeZones(updatedZones);

      // 🚨 THÊM: Cập nhật cache
      localStorage.setItem(
        `cachedSafeZones_${selectedPet}`,
        JSON.stringify(updatedZones)
      );

      toast.success(`✅ Đã cập nhật bán kính: ${radius}m`);
    } catch (error) {
      console.error("Error updating radius:", error);

      // 🚨 THÊM: Vẫn update local state ngay cả khi offline
      const updatedZones = safeZones.map((zone) =>
        zone._id === activeSafeZoneId ? { ...zone, radius } : zone
      );
      setSafeZones(updatedZones);
      localStorage.setItem(
        `cachedSafeZones_${selectedPet}`,
        JSON.stringify(updatedZones)
      );

      toast.warning(
        `⚠️ Đã cập nhật bán kính local (${radius}m) - sẽ sync khi online`
      );
    } finally {
      setIsUpdatingRadius(false);
    }
  };

  // Xử lý thay đổi radius từ slider
  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setRadius(newRadius);
  };

  // Apply radius khi nhấn Enter
  const handleRadiusKeyPress = (e) => {
    if (e.key === "Enter") {
      updateRadius();
    }
  };

  // Xóa toàn bộ dữ liệu đường đi (chỉ trên frontend)
  const handleClearPath = () => {
    if (window.confirm("Bạn có chắc muốn xóa dữ liệu đường đi hiển thị?")) {
      setPetData([]);
      localStorage.removeItem(`cachedPetData_${selectedPet}`);
      toast.info("🗑️ Đã xóa dữ liệu đường đi hiển thị");
    }
  };

  // Lấy thông tin pet đang chọn
  const getSelectedPetInfo = () => {
    return pets.find((pet) => pet._id === selectedPet);
  };

  // Lấy dữ liệu mới nhất
  const getLatestPetData = () => {
    return petData && petData.length > 0 ? petData[0] : null;
  };

  // Format time range
  const formatTimeRange = () => {
    if (!dataTimeRange.start || !dataTimeRange.end) return "";

    const start = new Date(dataTimeRange.start);
    const end = new Date(dataTimeRange.end);

    return `${start.toLocaleTimeString("vi-VN")} - ${end.toLocaleTimeString(
      "vi-VN"
    )}`;
  };

  // Lấy active safe zone
  const getActiveSafeZone = () => {
    return safeZones.find((zone) => zone._id === activeSafeZoneId);
  };

  // 🚨 THÊM: Xóa cache
  const clearAllCache = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả dữ liệu cached?")) {
      // Xóa tất cả cache liên quan đến pets
      localStorage.removeItem("cachedPets");
      localStorage.removeItem("selectedPetId");

      // Xóa cache của từng pet
      pets.forEach((pet) => {
        localStorage.removeItem(`cachedPetData_${pet._id}`);
        localStorage.removeItem(`cachedSafeZones_${pet._id}`);
      });

      toast.success("🧹 Đã xóa tất cả dữ liệu cached");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
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
            <div className="no-pets-icon">🐾</div>
            <p>Bạn chưa có pet nào!</p>
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
  const activeSafeZone = getActiveSafeZone();

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h2>🐕 Dashboard Theo Dõi Pet</h2>
            {selectedPetInfo && (
              <div className="current-pet-info">
                <span className="pet-name">{selectedPetInfo.name}</span>
                <span className="pet-species">{selectedPetInfo.species}</span>
              </div>
            )}
          </div>

          <div className="header-right">
            {latestData && (
              <div className="current-location">
                <span className="location-icon">📍</span>
                <span className="coordinates">
                  {latestData.latitude?.toFixed(6)},{" "}
                  {latestData.longitude?.toFixed(6)}
                </span>
                <span className="location-time">
                  {latestData.timestamp
                    ? new Date(latestData.timestamp).toLocaleTimeString("vi-VN")
                    : "N/A"}
                </span>
              </div>
            )}

            {/* 🚨 THÊM: Hiển thị trạng thái mạng */}
            <div className="network-status">
              <div
                className={`status-indicator ${
                  isOnline ? "online" : "offline"
                }`}
              >
                ●
              </div>
              <span className="status-text">
                {isOnline ? "Online" : "Offline"}
              </span>
              {usingCachedData && (
                <span
                  className="cache-indicator"
                  title="Đang sử dụng dữ liệu cached"
                >
                  📦
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pet Selector */}
        <div className="pet-selector">
          <div className="selector-header">
            <label>Chọn Pet để theo dõi:</label>
            <div className="selector-actions">
              <button
                className="refresh-btn"
                onClick={() => fetchPetData(selectedPet, true)}
                disabled={isFetchingData || !isOnline}
                title={!isOnline ? "Không thể refresh khi offline" : ""}
              >
                {isFetchingData ? "🔄 Đang tải..." : "🔄 Làm mới"}
              </button>
              <button
                className="cache-clear-btn"
                onClick={clearAllCache}
                title="Xóa dữ liệu cached"
              >
                🧹 Clear Cache
              </button>
            </div>
          </div>
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            disabled={isFetchingData}
          >
            {pets.map((pet) => (
              <option key={pet._id} value={pet._id}>
                {pet.name} ({pet.species}) - {pet.breed}
              </option>
            ))}
          </select>
        </div>

        {/* Safe Zone Controls - CHỈ HIỂN THỊ RADIUS CONTROL */}
        {safeZones.length > 0 && (
          <div className="safe-zone-controls-panel">
            <div className="safe-zone-header">
              <h3>🎯 Điều Chỉnh Vùng An Toàn</h3>
              <div className="active-zone-info">
                <span className="zone-name">
                  {activeSafeZone?.name || "Vùng an toàn tự động"}
                </span>
                <span className="zone-status">
                  {activeSafeZone?.autoCreated
                    ? " (Tự động tạo từ vị trí đầu tiên)"
                    : ""}
                </span>
              </div>
            </div>

            <div className="radius-control-container">
              <div className="radius-control-header">
                <label htmlFor="radius-slider">Bán kính vùng an toàn:</label>
                <div className="radius-value-display">
                  <span className="radius-value">{radius}m</span>
                  <span className="radius-range">(0 - 5000m)</span>
                  {!isOnline && (
                    <span
                      className="offline-badge"
                      title="Thay đổi sẽ được lưu local"
                    >
                      📦 Local
                    </span>
                  )}
                </div>
              </div>

              <div className="radius-slider-container">
                <input
                  type="range"
                  id="radius-slider"
                  min="0"
                  max="5000"
                  step="10"
                  value={radius}
                  onChange={handleRadiusChange}
                  onKeyPress={handleRadiusKeyPress}
                  className="radius-slider"
                  disabled={!activeSafeZoneId}
                />
                <div className="slider-labels">
                  <span>0m</span>
                  <span>100m</span>
                  <span>500m</span>
                  <span>1000m</span>
                  <span>2000m</span>
                  <span>5000m</span>
                </div>
              </div>

              <div className="radius-actions">
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
                  onKeyPress={handleRadiusKeyPress}
                  className="radius-input"
                  placeholder="Nhập bán kính..."
                  disabled={!activeSafeZoneId}
                />
                <button
                  className="update-radius-btn"
                  onClick={updateRadius}
                  disabled={isUpdatingRadius || !activeSafeZoneId}
                >
                  {isUpdatingRadius ? "⏳ Đang cập nhật..." : "💾 Cập nhật"}
                </button>
                <button
                  className="reset-radius-btn"
                  onClick={() => setRadius(activeSafeZone?.radius || 100)}
                  title="Reset về giá trị ban đầu"
                  disabled={!activeSafeZoneId}
                >
                  🔄 Reset
                </button>

                {/* Nút dọn dẹp safe zones cũ */}
                {isCleaningOldZones && (
                  <button className="cleaning-btn" disabled>
                    🧹 Đang dọn dẹp...
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Controls */}
        {petData.length > 0 && (
          <div className="map-controls-panel">
            <div className="control-buttons">
              <button
                className={`path-toggle-btn ${showPath ? "active" : ""}`}
                onClick={() => setShowPath(!showPath)}
              >
                {showPath ? "🗺️ Ẩn đường đi" : "🗺️ Hiện đường đi"}
              </button>
              <button
                className="clear-path-btn"
                onClick={handleClearPath}
                title="Xóa dữ liệu đường đi hiển thị"
              >
                🗑️ Xóa đường đi
              </button>
            </div>

            <div className="path-stats-summary">
              <div className="data-count">
                <span className="stat-icon">📍</span>
                <span className="stat-label">Số điểm:</span>
                <span className="stat-value">{petData.length}</span>
                {usingCachedData && (
                  <span className="cache-badge" title="Dữ liệu từ cache">
                    📦
                  </span>
                )}
              </div>

              {petData.length > 0 && (
                <>
                  <div className="time-range">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-label">Khoảng thời gian:</span>
                    <span className="stat-value">{formatTimeRange()}</span>
                  </div>

                  <div className="path-distance">
                    <span className="stat-icon">📏</span>
                    <span className="stat-label">Độ dài:</span>
                    <span className="stat-value">
                      {calculateTotalDistance(petData).toFixed(0)}m
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Grid - Map & Alerts */}
        <div className="grid-layout">
          {/* Map Section */}
          <div className="map-section">
            <div className="section-header">
              <h3>
                🗺️ Bản Đồ Theo Dõi
                {activeSafeZone && (
                  <span className="safe-zone-status">
                    (Vùng an toàn: {activeSafeZone.radius}m)
                  </span>
                )}
              </h3>
              {safeZones.length === 0 && !autoCreateDone && (
                <div className="zone-creation-status">
                  ⏳ Đang chờ vị trí đầu tiên để tạo vùng an toàn...
                </div>
              )}
            </div>

            {/* Real-time Map */}
            <RealTimeMap
              petData={petData}
              selectedPet={selectedPetInfo}
              safeZones={safeZones}
              activeSafeZoneId={activeSafeZoneId}
              showPath={showPath}
              currentRadius={radius} // Truyền radius hiện tại
            />
          </div>

          {/* Alerts Section Only */}
          <div className="alerts-section">
            <h3>⚠️ Cảnh Báo & Thông Báo</h3>
            <AlertSystem
              petData={petData}
              selectedPet={selectedPetInfo}
              safeZones={safeZones}
              currentRadius={radius}
            />
          </div>
        </div>

        {/* Pet List */}
        <div className="pet-list-section">
          <div className="section-header">
            <h3>📋 Danh Sách Pets Của Bạn</h3>
            <small>
              Tổng: {pets.length} pet{pets.length !== 1 ? "s" : ""}
            </small>
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
                  <div className="pet-details">
                    <span className="pet-species-badge">{pet.species}</span>
                    <span className="pet-age">🎂 {pet.age} tuổi</span>
                    <span className="pet-breed">🏷️ {pet.breed}</span>
                  </div>
                </div>
                <div className="pet-select-indicator">
                  {selectedPet === pet._id ? "✓" : "→"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Overlay */}
        {isFetchingData && (
          <div className="fetching-overlay">
            <div className="fetching-spinner"></div>
            <p>Đang cập nhật dữ liệu...</p>
          </div>
        )}
      </div>
    </>
  );
}

// Helper function to calculate total distance
function calculateTotalDistance(data) {
  if (!data || data.length < 2) return 0;

  let totalDistance = 0;
  const R = 6371000; // Earth's radius in meters

  for (let i = 1; i < data.length; i++) {
    const prev = data[i];
    const curr = data[i - 1];

    if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
      const dLat = (curr.latitude - prev.latitude) * (Math.PI / 180);
      const dLon = (curr.longitude - prev.longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(prev.latitude * (Math.PI / 180)) *
          Math.cos(curr.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
  }

  return totalDistance;
}

export default Dashboard;
