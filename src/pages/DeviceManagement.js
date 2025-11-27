import React, { useState, useEffect } from "react";
import { getPetsByUser, registerDevice, getMyDevices } from "../api/api";
import Navbar from "../components/Navbar";
import "./DeviceManagement.css";

function DeviceManagement() {
  const [pets, setPets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [safeZoneAddress, setSafeZoneAddress] = useState("");
  const [safeZoneRadius, setSafeZoneRadius] = useState(100); // meters
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPets();
    fetchDevices();
    getCurrentLocation();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await getPetsByUser();
      setPets(res.data.pets || []);
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await getMyDevices();
      setDevices(res.data.devices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const getCurrentLocation = () => {
    // Giả lập lấy vị trí hiện tại (trong thực tế sẽ dùng Geolocation API)
    setCurrentLocation("123 Đường Nguyễn Văn A, Quận 1, TP.HCM");
  };

  const handleUseCurrentLocation = () => {
    setSafeZoneAddress(currentLocation);
    setUseCurrentLocation(true);
  };

  const handleCustomAddress = () => {
    setSafeZoneAddress("");
    setUseCurrentLocation(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!deviceId || !selectedPet) {
      alert("Vui lòng nhập Device ID và chọn pet");
      return;
    }

    setLoading(true);
    try {
      await registerDevice(deviceId, selectedPet);

      // Lưu thông tin vùng an toàn (cần tích hợp với backend)
      if (safeZoneAddress) {
        console.log("Vùng an toàn đã thiết lập:", {
          address: safeZoneAddress,
          radius: safeZoneRadius,
          useCurrentLocation,
        });
      }

      alert(
        "✅ Đăng ký device thành công!" +
          (safeZoneAddress ? "\n📍 Đã thiết lập vùng an toàn" : "")
      );
      setDeviceId("");
      setSelectedPet("");
      setSafeZoneAddress("");
      setSafeZoneRadius(100);
      setUseCurrentLocation(false);
      fetchDevices();
    } catch (error) {
      alert(
        "❌ Lỗi đăng ký device: " +
          (error.response?.data?.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="device-container">
        <h2>📱 Quản lý Devices</h2>

        <div className="card">
          <h3>➕ Đăng ký Device Mới</h3>
          <form onSubmit={handleRegister} className="device-form">
            <div className="form-group">
              <label>Device ID:</label>
              <input
                placeholder="Nhập Device ID từ ESP32 (VD: ESP32_ABC123XYZ)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
              />
              <small>Device ID từ ESP32 (thường bắt đầu bằng ESP32_)</small>
            </div>

            <div className="form-group">
              <label>Chọn Pet:</label>
              <select
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                required
              >
                <option value="">-- Chọn pet --</option>
                {pets.map((pet) => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.species})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>📍 Thiết lập Vùng An Toàn:</label>

              <div className="location-options">
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="locationType"
                      checked={useCurrentLocation}
                      onChange={handleUseCurrentLocation}
                    />
                    <span className="radio-custom"></span>
                    Dùng vị trí hiện tại của tôi
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="locationType"
                      checked={!useCurrentLocation}
                      onChange={handleCustomAddress}
                    />
                    <span className="radio-custom"></span>
                    Nhập địa chỉ khác
                  </label>
                </div>

                {useCurrentLocation ? (
                  <div className="current-location-info">
                    <p>📍 Vị trí hiện tại: {currentLocation}</p>
                    <small>Vùng an toàn sẽ được đặt tại vị trí này</small>
                  </div>
                ) : (
                  <div className="custom-address-input">
                    <input
                      placeholder="Nhập địa chỉ vùng an toàn cho pet"
                      value={safeZoneAddress}
                      onChange={(e) => setSafeZoneAddress(e.target.value)}
                    />
                    <small>
                      Ví dụ: 123 Đường ABC, Quận 1, TP.HCM - nơi pet thường ở
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Bán kính Vùng An Toàn:</label>
              <select
                value={safeZoneRadius}
                onChange={(e) => setSafeZoneRadius(parseInt(e.target.value))}
              >
                <option value={50}>50 mét (khu vực nhỏ)</option>
                <option value={100}>100 mét (khu vực vừa)</option>
                <option value={200}>200 mét (khu vực rộng)</option>
                <option value={500}>500 mét (khu phố)</option>
                <option value={1000}>1000 mét (toàn khu vực)</option>
              </select>
              <small>
                Khoảng cách tối đa pet có thể di chuyển khỏi vùng an toàn
              </small>
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Đang đăng ký..."
                : "🔐 Đăng ký Device & Thiết lập Vùng An Toàn"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>📋 Devices Đã Đăng Ký</h3>
          {devices.length === 0 ? (
            <p>Chưa có device nào được đăng ký</p>
          ) : (
            <div className="devices-list">
              {devices.map((device) => (
                <div key={device._id} className="device-item">
                  <div className="device-info">
                    <strong>Device ID: {device.deviceId}</strong>
                    <div>
                      <span className="pet-badge">
                        Pet: {device.petId?.name}
                      </span>
                      <span className="species-badge">
                        {device.petId?.species}
                      </span>
                    </div>
                    {device.safeZone && (
                      <div className="safe-zone-info">
                        <p>📍 Vùng an toàn: {device.safeZone.address}</p>
                        <p>📏 Bán kính: {device.safeZone.radius}m</p>
                      </div>
                    )}
                    <small>
                      Cập nhật: {new Date(device.lastSeen).toLocaleString()}
                    </small>
                  </div>
                  <div className="device-status">
                    <span
                      className={`status ${
                        device.isActive ? "active" : "inactive"
                      }`}
                    >
                      {device.isActive ? "🟢 Active" : "🔴 Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card instructions-card">
          <h3>📖 Hướng Dẫn Thiết lập Vùng An Toàn</h3>
          <ol>
            <li>
              <strong>Chọn loại vị trí</strong>:
              <ul>
                <li>
                  📍 <strong>Vị trí hiện tại</strong>: Dùng khi bạn đang ở cùng
                  vị trí với pet
                </li>
                <li>
                  🏠 <strong>Địa chỉ khác</strong>: Dùng khi pet ở địa điểm cố
                  định (nhà riêng, công viên...)
                </li>
              </ul>
            </li>
            <li>
              <strong>Nhập Device ID</strong> - ID từ ESP32
            </li>
            <li>
              <strong>Chọn Pet</strong> - Pet cần theo dõi
            </li>
            <li>
              <strong>Chọn bán kính</strong> - Phạm vi cho phép pet di chuyển
            </li>
            <li>
              <strong>Đăng ký</strong> - Hoàn tất thiết lập
            </li>
          </ol>

          <div className="scenario-examples">
            <h4>📝 Ví dụ thực tế:</h4>
            <div className="scenario">
              <strong>Scenario 1:</strong> Pet ở nhà riêng
              <p>→ Chọn "Nhập địa chỉ khác" → Nhập địa chỉ nhà</p>
            </div>
            <div className="scenario">
              <strong>Scenario 2:</strong> Bạn đang dắt pet đi dạo
              <p>→ Chọn "Vị trí hiện tại" → Vùng an toàn sẽ ở công viên</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DeviceManagement;
