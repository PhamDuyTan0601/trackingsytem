import React, { useState, useEffect } from "react";
import { getPetsByUser, registerDevice } from "../api/api";
import Navbar from "../components/Navbar";
import "./DeviceManagement.css";

function DeviceManagement() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchPets();
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
  }, []);

  const fetchPets = async () => {
    try {
      const res = await getPetsByUser();
      setPets(res.data.pets || []);
    } catch (error) {
      console.error("Error fetching pets:", error);
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

      // Reset form
      setDeviceId("");
      setSelectedPet("");
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

        {/* Thông tin user */}
        {user && (
          <div
            className="card"
            style={{ marginBottom: "1.5rem", background: "#f0f9ff" }}
          >
            <h4>👤 Thông tin tài khoản</h4>
            <p>
              <strong>Tên:</strong> {user.name}
            </p>
            {user.phone && (
              <p>
                <strong>SĐT:</strong> {user.phone}
              </p>
            )}
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        )}

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
              <small>Chỉ hiển thị pets thuộc quyền sở hữu của bạn</small>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "🔐 Đăng ký Device"}
            </button>
          </form>
        </div>

        {/* Hướng dẫn sử dụng */}
        <div className="card instructions-card">
          <h3>📖 Hướng Dẫn Sử Dụng</h3>
          <ol>
            <li>
              <strong>Lấy Device ID từ ESP32:</strong> Device ID thường được
              hiển thị trên màn hình LCD của ESP32 hoặc trong Serial Monitor
              (thường bắt đầu bằng "ESP32_").
            </li>
            <li>
              <strong>Chọn Pet:</strong> Chọn pet mà bạn muốn gắn device theo
              dõi.
            </li>
            <li>
              <strong>Đăng ký:</strong> Nhấn "Đăng ký Device" để hoàn tất quá
              trình đăng ký.
            </li>
            <li>
              <strong>Theo dõi:</strong> Sau khi đăng ký thành công, bạn có thể
              theo dõi vị trí và trạng thái của pet trong mục Dashboard.
            </li>
            <li>
              <strong>Quản lý:</strong> Mỗi device chỉ có thể đăng ký với một
              pet duy nhất.
            </li>
          </ol>
        </div>
      </div>
    </>
  );
}

export default DeviceManagement;
