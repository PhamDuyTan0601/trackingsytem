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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPets();
    fetchDevices();
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!deviceId || !selectedPet) {
      alert("Vui lòng nhập Device ID và chọn pet");
      return;
    }

    setLoading(true);
    try {
      await registerDevice(deviceId, selectedPet);
      alert("✅ Đăng ký device thành công!");
      setDeviceId("");
      setSelectedPet("");
      setSafeZoneAddress("");
      setSafeZoneRadius(100);
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
              <label>Địa chỉ Vùng An Toàn (Tùy chọn):</label>
              <input
                placeholder="Nhập địa chỉ vùng an toàn cho pet"
                value={safeZoneAddress}
                onChange={(e) => setSafeZoneAddress(e.target.value)}
              />
              <small>Ví dụ: 123 Đường ABC, Quận 1, TP.HCM</small>
            </div>

            <div className="form-group">
              <label>Bán kính Vùng An Toàn (mét):</label>
              <select
                value={safeZoneRadius}
                onChange={(e) => setSafeZoneRadius(parseInt(e.target.value))}
              >
                <option value={50}>50 mét</option>
                <option value={100}>100 mét</option>
                <option value={200}>200 mét</option>
                <option value={500}>500 mét</option>
                <option value={1000}>1000 mét</option>
              </select>
              <small>
                Khoảng cách tối đa pet có thể di chuyển khỏi vùng an toàn
              </small>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "🔐 Đăng ký Device"}
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
          <h3>📖 Hướng Dẫn Sử Dụng</h3>
          <ol>
            <li>
              <strong>Nhập Device ID</strong> - Nhập ID từ ESP32 (thường bắt đầu
              bằng ESP32_)
            </li>
            <li>
              <strong>Chọn Pet</strong> - Chọn pet mà device sẽ theo dõi
            </li>
            <li>
              <strong>Thiết lập Vùng An Toàn</strong> - Nhập địa chỉ và bán kính
              vùng an toàn (tùy chọn)
            </li>
            <li>
              <strong>Đăng ký</strong> - Nhấn "Đăng ký Device"
            </li>
            <li>
              <strong>Cấu hình ESP32</strong> - Dùng Device ID trong code ESP32
            </li>
          </ol>
          <div className="code-block">
            <strong>Code ESP32 mẫu:</strong>
            <code>String deviceId = "{deviceId || "ESP32_ABC123XYZ"}";</code>
          </div>
        </div>
      </div>
    </>
  );
}

export default DeviceManagement;
