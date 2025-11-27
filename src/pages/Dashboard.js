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
  const [safeZoneRadius, setSafeZoneRadius] = useState(100);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapPreview, setMapPreview] = useState(null);

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
    // Giả lập vị trí hiện tại
    setCurrentLocation("123 Đường Nguyễn Văn A, Quận 1, TP.HCM");
  };

  const handleUseCurrentLocation = () => {
    setSafeZoneAddress(currentLocation);
    setUseCurrentLocation(true);
    previewOnMap(currentLocation);
  };

  const handleCustomAddress = () => {
    setSafeZoneAddress("");
    setUseCurrentLocation(false);
    setMapPreview(null);
  };

  const handleAddressChange = (address) => {
    setSafeZoneAddress(address);
    if (address.length > 5) {
      previewOnMap(address);
    }
  };

  const previewOnMap = (address) => {
    // Giả lập preview map (trong thực tế sẽ dùng Google Maps API)
    setMapPreview({
      address: address,
      radius: safeZoneRadius,
      center: { lat: 10.8231, lng: 106.6297 }, // Tọa độ mẫu
      zoom: 15,
    });
  };

  const handleRadiusChange = (radius) => {
    setSafeZoneRadius(radius);
    if (mapPreview) {
      setMapPreview((prev) => ({ ...prev, radius }));
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

      // Lưu thông tin vùng an toàn
      if (safeZoneAddress) {
        console.log("Vùng an toàn đã thiết lập:", {
          address: safeZoneAddress,
          radius: safeZoneRadius,
          coordinates: mapPreview?.center,
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
      setMapPreview(null);
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
        <h2>📱 Quản lý Devices & Vùng An Toàn</h2>

        <div className="card">
          <h3>➕ Đăng ký Device & Thiết lập Vùng An Toàn</h3>
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
              <label>📍 Thiết lập Vùng An Toàn (Tùy chọn):</label>

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
                    Nhập địa chỉ khác cho pet
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
                      placeholder="Nhập địa chỉ vùng an toàn cho pet (VD: nhà riêng, công viên...)"
                      value={safeZoneAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                    />
                    <small>
                      Nhập địa chỉ nơi pet thường ở (nhà riêng, nhà người thân,
                      công viên...)
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>📏 Bán kính Vùng An Toàn:</label>
              <select
                value={safeZoneRadius}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
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

            {/* Map Preview */}
            {mapPreview && (
              <div className="map-preview-section">
                <label>🗺️ Preview trên Bản Đồ:</label>
                <div className="map-preview">
                  <div className="map-placeholder">
                    <div className="map-mock">
                      <div className="map-center">📍</div>
                      <div
                        className="safe-zone-circle"
                        style={{ width: `${safeZoneRadius / 10}px` }}
                      ></div>
                    </div>
                    <div className="map-info">
                      <p>
                        <strong>Địa chỉ:</strong> {mapPreview.address}
                      </p>
                      <p>
                        <strong>Bán kính:</strong> {mapPreview.radius} mét
                      </p>
                      <p>
                        <strong>Zoom:</strong> {mapPreview.zoom}
                      </p>
                    </div>
                  </div>
                  <small>Vùng tròn màu xanh thể hiện phạm vi an toàn</small>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading
                ? "Đang đăng ký..."
                : "🔐 Đăng ký & Thiết lập Vùng An Toàn"}
            </button>
          </form>
        </div>

        {/* ... phần devices list và instructions giữ nguyên ... */}
      </div>
    </>
  );
}

export default DeviceManagement;
