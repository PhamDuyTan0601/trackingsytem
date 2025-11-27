import React, { useState, useEffect, useRef } from "react";
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
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const addressInputRef = useRef(null);

  useEffect(() => {
    fetchPets();
    fetchDevices();

    // Load Google Maps Places API
    loadGoogleMapsAPI();
  }, []);

  const loadGoogleMapsAPI = () => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  };

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

  const handleAddressInput = (address) => {
    setSafeZoneAddress(address);

    if (address.length > 2 && window.google) {
      getAddressSuggestions(address);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const getAddressSuggestions = (input) => {
    if (!window.google || !window.google.maps) return;

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input, componentRestrictions: { country: "vn" } },
      (predictions, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setAddressSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const selectAddress = (address) => {
    setSafeZoneAddress(address.description);
    setAddressSuggestions([]);
    setShowSuggestions(false);
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
      setAddressSuggestions([]);
      setShowSuggestions(false);
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
              <label>📍 Địa chỉ Vùng An Toàn (Tùy chọn):</label>
              <div className="address-autocomplete">
                <input
                  ref={addressInputRef}
                  placeholder="Nhập địa chỉ vùng an toàn..."
                  value={safeZoneAddress}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() =>
                    safeZoneAddress.length > 2 && setShowSuggestions(true)
                  }
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectAddress(suggestion)}
                      >
                        {suggestion.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small>
                Nhập địa chỉ nơi pet thường ở để thiết lập vùng an toàn
              </small>
            </div>

            <div className="form-group">
              <label>📏 Bán kính Vùng An Toàn:</label>
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
          <h3>📖 Hướng Dẫn Sử Dụng</h3>
          <ol>
            <li>
              <strong>Nhập Device ID</strong> - ID từ ESP32
            </li>
            <li>
              <strong>Chọn Pet</strong> - Pet mà device sẽ theo dõi
            </li>
            <li>
              <strong>Thiết lập Vùng An Toàn</strong> - Nhập địa chỉ và chọn bán
              kính
            </li>
            <li>
              <strong>Đăng ký</strong> - Hoàn tất thiết lập
            </li>
          </ol>
        </div>
      </div>
    </>
  );
}

export default DeviceManagement;
