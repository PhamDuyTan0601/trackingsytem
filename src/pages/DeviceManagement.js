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
  const safeZoneAutocompleteRef = useRef(null);
  const defaultAddressAutocompleteRef = useRef(null);
  const safeZoneInputRef = useRef(null);
  const defaultAddressInputRef = useRef(null);

  useEffect(() => {
    fetchPets();
    fetchDevices();

    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = initAutocompletes;
    } else {
      initAutocompletes();
    }
  }, []);

  const initAutocompletes = () => {
    if (window.google) {
      // Autocomplete cho vùng an toàn
      if (safeZoneInputRef.current) {
        safeZoneAutocompleteRef.current =
          new window.google.maps.places.Autocomplete(safeZoneInputRef.current, {
            types: ["address"],
            componentRestrictions: { country: "vn" },
            fields: ["formatted_address", "geometry", "name"],
          });
        safeZoneAutocompleteRef.current.addListener("place_changed", () => {
          const place = safeZoneAutocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            setSafeZoneAddress(place.formatted_address);
          }
        });
      }

      // Autocomplete cho địa chỉ mặc định
      if (defaultAddressInputRef.current) {
        defaultAddressAutocompleteRef.current =
          new window.google.maps.places.Autocomplete(
            defaultAddressInputRef.current,
            {
              types: ["address"],
              componentRestrictions: { country: "vn" },
              fields: ["formatted_address", "geometry", "name"],
            }
          );
        defaultAddressAutocompleteRef.current.addListener(
          "place_changed",
          () => {
            const place = defaultAddressAutocompleteRef.current.getPlace();
            if (place && place.formatted_address) {
              setDefaultAddress(place.formatted_address);
            }
          }
        );
      }
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!deviceId || !selectedPet) {
      alert("Vui lòng nhập Device ID và chọn pet");
      return;
    }

    setLoading(true);
    try {
      await registerDevice(deviceId, selectedPet);

      // Lưu thông tin vùng an toàn và địa chỉ mặc định
      const deviceData = {
        deviceId,
        petId: selectedPet,
        safeZone: safeZoneAddress
          ? {
              address: safeZoneAddress,
              radius: safeZoneRadius,
            }
          : null,
        defaultAddress: defaultAddress || null,
      };

      console.log("Thông tin device đã đăng ký:", deviceData);

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

  const handleUseDefaultAsSafeZone = () => {
    if (defaultAddress) {
      setSafeZoneAddress(defaultAddress);
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
                  ref={defaultAddressInputRef}
                  placeholder="Nhập địa chỉ mặc định (nhà riêng, căn hộ...)"
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  type="text"
                />
              </div>
              <small>
                Địa chỉ nơi pet thường ở nhất (nhà riêng, căn hộ...)
              </small>
            </div>

            <div className="form-group">
              <label>📍 Địa chỉ Vùng An Toàn (Tùy chọn):</label>
              <div className="address-with-action">
                <div className="address-autocomplete">
                  <input
                    ref={safeZoneInputRef}
                    placeholder="Nhập địa chỉ vùng an toàn..."
                    value={safeZoneAddress}
                    onChange={(e) => setSafeZoneAddress(e.target.value)}
                    type="text"
                  />
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
                    {device.defaultAddress && (
                      <div className="default-address-info">
                        <p>🏠 Địa chỉ mặc định: {device.defaultAddress}</p>
                      </div>
                    )}
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
              <strong>Nhập địa chỉ mặc định</strong> - Nơi pet thường ở nhất
              (nhà riêng)
            </li>
            <li>
              <strong>Thiết lập Vùng An Toàn</strong> - Có thể dùng địa chỉ mặc
              định hoặc nhập địa chỉ khác
            </li>
            <li>
              <strong>Chọn Bán Kính</strong> - Phạm vi an toàn cho pet
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
