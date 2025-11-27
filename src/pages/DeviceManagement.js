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
  const [defaultAddress, setDefaultAddress] = useState("");
  const [safeZoneRadius, setSafeZoneRadius] = useState(100);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

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

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=vn&limit=5`
      );
      const data = await response.json();

      const addresses = data.map((item) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }));

      setSuggestions(addresses);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setSuggestions([]);
    }
  };

  const handleAddressInput = (value, type) => {
    if (type === "default") {
      setDefaultAddress(value);
    } else {
      setSafeZoneAddress(value);
    }

    // Debounce search
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  const selectSuggestion = (address, type) => {
    if (type === "default") {
      setDefaultAddress(address.display_name);
    } else {
      setSafeZoneAddress(address.display_name);
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleUseDefaultAsSafeZone = () => {
    if (defaultAddress) {
      setSafeZoneAddress(defaultAddress);
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

      alert(
        "✅ Đăng ký device thành công!" +
          (safeZoneAddress ? "\n📍 Đã thiết lập vùng an toàn" : "") +
          (defaultAddress ? "\n🏠 Đã thiết lập địa chỉ mặc định" : "")
      );

      // Reset form
      setDeviceId("");
      setSelectedPet("");
      setSafeZoneAddress("");
      setDefaultAddress("");
      setSafeZoneRadius(100);
      setShowSuggestions(false);
      setSuggestions([]);
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
              <label>🏠 Địa chỉ Mặc định (Nhà của pet):</label>
              <div className="address-autocomplete">
                <input
                  placeholder="Nhập địa chỉ mặc định (VD: 123 Lê Lợi Quận 1 TP.HCM)"
                  value={defaultAddress}
                  onChange={(e) =>
                    handleAddressInput(e.target.value, "default")
                  }
                  onFocus={() =>
                    defaultAddress.length >= 2 && setShowSuggestions(true)
                  }
                  type="text"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((address, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => selectSuggestion(address, "default")}
                      >
                        📍 {address.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small>
                Địa chỉ nơi pet thường ở nhất (nhập ít nhất 3 ký tự để xem gợi
                ý)
              </small>
            </div>

            <div className="form-group">
              <label>📍 Địa chỉ Vùng An Toàn (Tùy chọn):</label>
              <div className="address-with-action">
                <div className="address-autocomplete">
                  <input
                    placeholder="Nhập địa chỉ vùng an toàn..."
                    value={safeZoneAddress}
                    onChange={(e) =>
                      handleAddressInput(e.target.value, "safeZone")
                    }
                    onFocus={() =>
                      safeZoneAddress.length >= 2 && setShowSuggestions(true)
                    }
                    type="text"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions.map((address, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => selectSuggestion(address, "safeZone")}
                        >
                          📍 {address.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {defaultAddress && (
                  <button
                    type="button"
                    className="use-default-btn"
                    onClick={handleUseDefaultAsSafeZone}
                  >
                    Dùng địa chỉ mặc định
                  </button>
                )}
              </div>
              <small>
                Địa chỉ vùng an toàn cho pet (có thể khác với địa chỉ mặc định)
              </small>
            </div>

            <div className="form-group">
              <label>📏 Bán kính Vùng An Toàn:</label>
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
              {loading ? "Đang đăng ký..." : "🔐 Đăng ký Device"}
            </button>
          </form>
        </div>

        {/* ... phần còn lại giữ nguyên ... */}
      </div>
    </>
  );
}

export default DeviceManagement;
