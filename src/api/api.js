import axios from "axios";

// ===============================
// 🌐 CONFIG
// ===============================
const API_URL =
  process.env.REACT_APP_API_URL || "https://pettracking2.onrender.com";

// ===============================
// 🛠️ AUTH HEADER HELPER
// ===============================
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ No authentication token found!");
    return {};
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ===============================
// 🧮 UTILITY FUNCTIONS (ĐẶT Ở ĐẦU FILE)
// ===============================

// 🚨 THÊM HÀM NÀY TRƯỚC KHI ĐƯỢC SỬ DỤNG
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters

  return distance;
};

// ===============================
// 🧑‍💼 USER APIs
// ===============================

export const registerUser = (userData) =>
  axios.post(`${API_URL}/api/users/register`, userData);

export const loginUser = async (userData) => {
  const response = await axios.post(`${API_URL}/api/users/login`, userData);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "/login";
};

export const getUserProfile = async () =>
  axios.get(`${API_URL}/api/users/profile`, getAuthHeader());

export const updateUserProfile = async (userData) =>
  axios.put(`${API_URL}/api/users/profile`, userData, getAuthHeader());

// ===============================
// 🐾 PET APIs
// ===============================

export const getPetsByUser = async () =>
  axios.get(`${API_URL}/api/pets/my-pets`, getAuthHeader());

export const addPet = async (petData) =>
  axios.post(`${API_URL}/api/pets`, petData, getAuthHeader());

export const getPetById = async (petId) =>
  axios.get(`${API_URL}/api/pets/${petId}`, getAuthHeader());

export const deletePet = async (petId) =>
  axios.delete(`${API_URL}/api/pets/${petId}`, getAuthHeader());

// ===============================
// 🛡️ SAFE ZONE APIs
// ===============================

export const getSafeZones = async (petId) =>
  axios.get(`${API_URL}/api/pets/${petId}/safe-zones`, getAuthHeader());

export const addSafeZone = async (petId, safeZoneData) =>
  axios.post(
    `${API_URL}/api/pets/${petId}/safe-zones`,
    safeZoneData,
    getAuthHeader()
  );

export const updateSafeZone = async (petId, zoneId, updateData) =>
  axios.put(
    `${API_URL}/api/pets/${petId}/safe-zones/${zoneId}`,
    updateData,
    getAuthHeader()
  );

export const toggleSafeZone = async (petId, zoneId) =>
  axios.patch(
    `${API_URL}/api/pets/${petId}/safe-zones/${zoneId}/toggle`,
    {},
    getAuthHeader()
  );

export const deleteSafeZone = async (petId, zoneId) =>
  axios.delete(
    `${API_URL}/api/pets/${petId}/safe-zones/${zoneId}`,
    getAuthHeader()
  );

// ===============================
// 📈 PET DATA APIs
// ===============================

export const getLatestPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}/latest`, getAuthHeader());

export const getAllPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}`, getAuthHeader());

export const getPetDataInRange = async (petId, startDate, endDate) =>
  axios.get(
    `${API_URL}/api/petData/pet/${petId}?start=${startDate}&end=${endDate}`,
    getAuthHeader()
  );

// ===============================
// 📱 DEVICE APIs
// ===============================

export const registerDevice = async (deviceId, petId) =>
  axios.post(
    `${API_URL}/api/devices/register`,
    { deviceId, petId },
    getAuthHeader()
  );

export const getMyDevices = async () =>
  axios.get(`${API_URL}/api/devices/my-devices`, getAuthHeader());

export const getPetByDevice = async (deviceId) =>
  axios.get(`${API_URL}/api/devices/pet/${deviceId}`);

export const getDeviceConfig = async (deviceId) =>
  axios.get(`${API_URL}/api/devices/config/${deviceId}`);

export const testDeviceConfig = async (deviceId) => {
  try {
    const response = await getDeviceConfig(deviceId);
    console.log("✅ Device Config Response:", response.data);
    if (response.data.safeZones) {
      console.log(`📦 Safe Zones received: ${response.data.safeZones.length}`);
      response.data.safeZones.forEach((zone, index) => {
        console.log(`   Zone ${index + 1}: ${zone.name} (${zone.radius}m)`);
      });
    }
    return response;
  } catch (error) {
    console.error(
      "❌ Device Config Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const triggerDeviceConfig = async (deviceId) =>
  axios.post(`${API_URL}/api/devices/trigger-config/${deviceId}`);

// ===============================
// 🛠️ EXPORTED UTILITY FUNCTIONS
// ===============================

// 🚨 EXPORT HÀM calculateDistance
export { calculateDistance };

// Kiểm tra xem điểm có nằm trong bất kỳ safe zone nào không
export const isPointInAnySafeZone = (pointLat, pointLng, safeZones = []) => {
  if (!safeZones || safeZones.length === 0) return false;

  for (const zone of safeZones) {
    if (zone.isActive && isPointInSafeZone(pointLat, pointLng, zone)) {
      return {
        inZone: true,
        zoneName: zone.name,
        zoneId: zone._id,
        radius: zone.radius,
      };
    }
  }

  return { inZone: false };
};

// Kiểm tra xem điểm có nằm trong safe zone không
export const isPointInSafeZone = (pointLat, pointLng, safeZone) => {
  if (!safeZone || !safeZone.center) return false;

  const distance = calculateDistance(
    pointLat,
    pointLng,
    safeZone.center.lat,
    safeZone.center.lng
  );

  return distance <= safeZone.radius;
};

// Format ESP32 config với safeZones array
export const formatESP32Config = (configData) => {
  return {
    deviceId: configData.deviceId,
    petId: configData.petId,
    petName: configData.petName,
    phoneNumber: configData.phoneNumber,
    ownerName: configData.ownerName,
    serverUrl: configData.serverUrl || API_URL,
    updateInterval: configData.updateInterval || 30000,
    safeZones: configData.safeZones || [],
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  };
};

// Thêm hàm để force gửi config khi safe zone thay đổi
export const forceConfigUpdate = async (petId) => {
  try {
    const devices = await getMyDevices();
    const device = devices.data.devices.find(
      (d) => d.petId === petId || d.petId._id === petId
    );

    if (device) {
      console.log(`🔧 Force updating config for device: ${device.deviceId}`);
      return await triggerDeviceConfig(device.deviceId);
    }
  } catch (error) {
    console.error("❌ Force config update error:", error);
  }
};

// Validate số điện thoại Việt Nam
export const validateVietnamesePhone = (phone) => {
  const phoneRegex =
    /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return phoneRegex.test(phone);
};

// Format số điện thoại hiển thị
export const formatPhoneDisplay = (phone) => {
  if (!phone) return "";
  if (phone.startsWith("+84")) {
    return phone.replace(/(\+84)(\d{2})(\d{3})(\d{3})/, "$1 $2 $3 $4");
  } else if (phone.startsWith("0")) {
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
  }
  return phone;
};

// Kiểm tra token có hợp lệ không
export const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = payload.exp * 1000 <= Date.now();
    return !isExpired;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

// Lấy thông tin user từ localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

// Kiểm tra xem user đã đăng nhập chưa
export const isAuthenticated = () => {
  return !!localStorage.getItem("token") && isTokenValid();
};

// Lấy deviceId từ URL parameters
export const getDeviceIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("deviceId") || params.get("device_id") || null;
};

// Debug với thông tin chi tiết hơn
export const debugAPIEndpoints = () => {
  console.log("🔧 API Endpoints Debug:");
  console.log("Base URL:", API_URL);
  console.log("Device Config:", `${API_URL}/api/devices/config/{deviceId}`);
  console.log("Safe Zones:", `${API_URL}/api/pets/{petId}/safe-zones`);
  console.log(
    "Auth Token:",
    localStorage.getItem("token") ? "✅ Present" : "❌ Missing"
  );

  const deviceId = prompt("Enter deviceId for config test:");
  if (deviceId) {
    testDeviceConfig(deviceId);
  }
};

// Tạo instance axios
const apiInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptors
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      logoutUser();
    }

    return Promise.reject(error);
  }
);

export { apiInstance };
export default apiInstance;
