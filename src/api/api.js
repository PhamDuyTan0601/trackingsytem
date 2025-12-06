import axios from "axios";

// ===============================
// 🌐 CONFIG
// ===============================
const API_URL =
  process.env.REACT_APP_API_URL || "https://pettracking2.onrender.com";

// ===============================
// 👤 USER APIs - ĐÃ CẬP NHẬT
// ===============================

// Đăng ký tài khoản - THÊM SỐ ĐIỆN THOẠI
export const registerUser = (userData) =>
  axios.post(`${API_URL}/api/users/register`, userData);

// Đăng nhập - hỗ trợ cả email và số điện thoại
export const loginUser = async (userData) => {
  const response = await axios.post(`${API_URL}/api/users/login`, userData);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response;
};

// Đăng xuất
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
};

// Lấy thông tin user profile
export const getUserProfile = async () =>
  axios.get(`${API_URL}/api/users/profile`, getAuthHeader());

// Cập nhật thông tin user (bao gồm số điện thoại)
export const updateUserProfile = async (userData) =>
  axios.put(`${API_URL}/api/users/profile`, userData, getAuthHeader());

// ===============================
// 🐾 PET APIs
// ===============================

// Helper để gửi token
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found!");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Lấy danh sách pet của user hiện tại
export const getPetsByUser = async () =>
  axios.get(`${API_URL}/api/pets/my-pets`, getAuthHeader());

// Tạo pet mới
export const addPet = async (petData) =>
  axios.post(`${API_URL}/api/pets`, petData, getAuthHeader());

// Lấy chi tiết 1 pet (chỉ owner thấy)
export const getPetById = async (petId) =>
  axios.get(`${API_URL}/api/pets/${petId}`, getAuthHeader());

// Xóa pet
export const deletePet = async (petId) =>
  axios.delete(`${API_URL}/api/pets/${petId}`, getAuthHeader());

// ===============================
// 🆕 SAFE ZONES MANAGEMENT APIs
// ===============================

// Lấy danh sách safe zones của pet
export const getPetSafeZones = async (petId) =>
  axios.get(`${API_URL}/api/pets/${petId}/safezones`, getAuthHeader());

// Thêm safe zone mới
export const addSafeZone = async (petId, safeZoneData) =>
  axios.post(
    `${API_URL}/api/pets/${petId}/safezones`,
    safeZoneData,
    getAuthHeader()
  );

// Cập nhật safe zone
export const updateSafeZone = async (petId, zoneId, updateData) =>
  axios.put(
    `${API_URL}/api/pets/${petId}/safezones/${zoneId}`,
    updateData,
    getAuthHeader()
  );

// Xóa safe zone
export const deleteSafeZone = async (petId, zoneId) =>
  axios.delete(
    `${API_URL}/api/pets/${petId}/safezones/${zoneId}`,
    getAuthHeader()
  );

// ===============================
// 📈 PET DATA APIs
// ===============================
export const getLatestPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}/latest`, getAuthHeader());

export const getAllPetData = async (petId, params = {}) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}`, {
    ...getAuthHeader(),
    params: {
      limit: 1000,
      ...params,
    },
  });

// ===============================
// 📱 DEVICE APIs - THÊM ENDPOINT MỚI
// ===============================

// Đăng ký device với pet
export const registerDevice = async (deviceId, petId) =>
  axios.post(
    `${API_URL}/api/devices/register`,
    { deviceId, petId },
    getAuthHeader()
  );

// Lấy danh sách devices của user
export const getMyDevices = async () =>
  axios.get(`${API_URL}/api/devices/my-devices`, getAuthHeader());

// Lấy thông tin pet từ deviceId (cho ESP32)
export const getPetByDevice = async (deviceId) =>
  axios.get(`${API_URL}/api/devices/pet/${deviceId}`);

// 🆕 ESP32 lấy cấu hình (petId, phoneNumber, petName, ownerName, safe zones)
export const getDeviceConfig = async (deviceId) =>
  axios.get(`${API_URL}/api/devices/config/${deviceId}`);

// 🆕 Cập nhật safe zones cho device (push to ESP32)
export const updateDeviceSafeZones = async (deviceId, safeZones) =>
  axios.put(
    `${API_URL}/api/devices/${deviceId}/safezones`,
    { safeZones },
    getAuthHeader()
  );

// 🆕 Lấy safe zones của device
export const getDeviceSafeZones = async (deviceId) =>
  axios.get(`${API_URL}/api/devices/${deviceId}/safezones`, getAuthHeader());

// 🆕 Tạo multiple safe zones từ map
export const createMultipleSafeZones = async (deviceId, safeZones) =>
  axios.post(
    `${API_URL}/api/devices/${deviceId}/safezones/multiple`,
    { safeZones },
    getAuthHeader()
  );

// ===============================
// 🆕 MQTT MANAGEMENT APIs (Cho dashboard admin)
// ===============================

// Lấy trạng thái MQTT connection
export const getMQTTStatus = async () =>
  axios.get(`${API_URL}/health`, getAuthHeader());

// Gửi command đến ESP32 qua MQTT (reboot, get config, etc.)
export const sendCommandToDevice = async (deviceId, command, data = {}) => {
  // Note: Cần backend endpoint để forward command qua MQTT
  return axios.post(
    `${API_URL}/api/devices/${deviceId}/command`,
    { command, ...data },
    getAuthHeader()
  );
};

// ===============================
// 🛠️ UTILITY FUNCTIONS - THÊM HÀM TIỆN ÍCH
// ===============================

// Validate số điện thoại Việt Nam
export const validateVietnamesePhone = (phone) => {
  const phoneRegex =
    /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return phoneRegex.test(phone);
};

// Format số điện thoại hiển thị
export const formatPhoneDisplay = (phone) => {
  if (!phone) return "";
  // Format: 0912 345 678
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
};

// Kiểm tra token có hợp lệ không
export const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    // Kiểm tra cơ bản token (không verify signature)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Refresh token (nếu backend hỗ trợ)
export const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/api/users/refresh-token`,
      {},
      getAuthHeader()
    );
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      return true;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
};

// ===============================
// 🆕 GEO UTILITIES - HỖ TRỢ MAP FUNCTIONS
// ===============================

// Tính khoảng cách giữa 2 điểm (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính Trái đất tính bằng km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert to meters
};

// Kiểm tra điểm có trong safe zone không
export const isPointInSafeZone = (
  pointLat,
  pointLng,
  zoneCenter,
  zoneRadius
) => {
  const distance = calculateDistance(
    pointLat,
    pointLng,
    zoneCenter.lat,
    zoneCenter.lng
  );
  return distance <= zoneRadius;
};

// Format safe zone cho display
export const formatSafeZoneForDisplay = (zone) => ({
  id: zone._id || zone.id,
  name: zone.name || "Safe Zone",
  center: {
    lat: zone.center?.lat || zone.center_lat,
    lng: zone.center?.lng || zone.center_lng,
  },
  radius: zone.radius || zone.radius_meters || 100,
  isActive: zone.isActive !== false,
  color: zone.color || "#10B981",
  createdAt: zone.createdAt,
});

// ===============================
// 🆕 DEVICE CONFIG UTILITIES
// ===============================

// Tạo config object để gửi cho ESP32
export const createDeviceConfig = (deviceId, pet, owner, safeZones) => ({
  deviceId: deviceId,
  petId: pet._id,
  petName: pet.name,
  ownerPhone: owner.phone,
  ownerName: owner.name,
  safeZones: safeZones.map((zone) => ({
    zone_id: zone._id,
    name: zone.name,
    center_lat: zone.center.lat,
    center_lng: zone.center.lng,
    radius_meters: zone.radius,
    is_active: zone.isActive,
  })),
  serverUrl: API_URL,
  updateInterval: 30000,
  timestamp: new Date().toISOString(),
});

// ===============================
// 🆕 ERROR HANDLING ENHANCEMENTS
// ===============================

// Interceptor cho lỗi authentication
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired or invalid. Logging out...");
      logoutUser();
      window.location.href = "/login";
    }

    // Xử lý lỗi mạng
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNREFUSED") {
      console.error("🌐 Network error - Cannot connect to server");
      // Có thể thêm thông báo cho user ở đây
      if (window.location.pathname !== "/login") {
        // Hiển thị notification cho user
        if (typeof window !== "undefined" && window.showToast) {
          window.showToast(
            "Mất kết nối với server. Vui lòng thử lại sau.",
            "error"
          );
        }
      }
    }

    return Promise.reject(error);
  }
);

// ===============================
// 🆕 API STATUS CHECK
// ===============================

// Kiểm tra server status
export const checkServerStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    return {
      status: "online",
      data: response.data,
    };
  } catch (error) {
    return {
      status: "offline",
      error: error.message,
    };
  }
};

// Kiểm tra MQTT status
export const checkMQTTStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return {
      mqtt: response.data.mqtt || "unknown",
      database: response.data.database || "unknown",
      status: response.data.status || "unknown",
    };
  } catch (error) {
    return {
      mqtt: "disconnected",
      database: "disconnected",
      status: "error",
    };
  }
};

// ===============================
// 🆕 BATCH OPERATIONS
// ===============================

// Xóa nhiều safe zones cùng lúc
export const deleteMultipleSafeZones = async (petId, zoneIds) => {
  const requests = zoneIds.map((zoneId) =>
    deleteSafeZone(petId, zoneId).catch((error) => ({ id: zoneId, error }))
  );
  return Promise.all(requests);
};

// Cập nhật nhiều safe zones cùng lúc
export const updateMultipleSafeZones = async (petId, zonesData) => {
  const requests = zonesData.map((zone) =>
    updateSafeZone(petId, zone.id, zone.data).catch((error) => ({
      id: zone.id,
      error,
    }))
  );
  return Promise.all(requests);
};

// ===============================
// 🆕 DATA EXPORT/IMPORT
// ===============================

// Xuất safe zones data (cho backup)
export const exportSafeZones = async (petId) => {
  const response = await getPetSafeZones(petId);
  const data = {
    petId: petId,
    safeZones: response.data.safeZones,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  // Tạo file download
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `safe-zones-${petId}-${
    new Date().toISOString().split("T")[0]
  }.json`;
  a.click();
  URL.revokeObjectURL(url);

  return data;
};

// Import safe zones data
export const importSafeZones = async (petId, jsonData) => {
  try {
    const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    if (!data.safeZones || !Array.isArray(data.safeZones)) {
      throw new Error("Invalid data format");
    }

    // Xóa safe zones cũ
    const currentZones = await getPetSafeZones(petId);
    const deletePromises = currentZones.data.safeZones.map((zone) =>
      deleteSafeZone(petId, zone._id)
    );
    await Promise.all(deletePromises);

    // Thêm safe zones mới
    const addPromises = data.safeZones.map((zone) => addSafeZone(petId, zone));
    const results = await Promise.all(addPromises);

    return {
      success: true,
      imported: results.length,
      message: `Đã import ${results.length} safe zones`,
    };
  } catch (error) {
    console.error("Import error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ===============================
// 🆕 REALTIME UPDATES (WebSocket alternative)
// ===============================

// Polling function cho real-time data
export const startPolling = (callback, interval = 5000) => {
  let isPolling = true;

  const poll = async () => {
    if (!isPolling) return;

    try {
      await callback();
    } catch (error) {
      console.error("Polling error:", error);
    }

    if (isPolling) {
      setTimeout(poll, interval);
    }
  };

  poll();

  return () => {
    isPolling = false;
  };
};

// ===============================
// 🆕 CACHE MANAGEMENT
// ===============================

const cache = {
  pets: null,
  devices: null,
  lastUpdated: {},
};

// Cached get pets
export const getCachedPets = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    cache.pets &&
    Date.now() - cache.lastUpdated.pets < 30000
  ) {
    return cache.pets;
  }

  try {
    const response = await getPetsByUser();
    cache.pets = response.data.pets;
    cache.lastUpdated.pets = Date.now();
    return cache.pets;
  } catch (error) {
    // Return cached data even if error (for offline mode)
    return cache.pets || [];
  }
};

// Cached get devices
export const getCachedDevices = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    cache.devices &&
    Date.now() - cache.lastUpdated.devices < 30000
  ) {
    return cache.devices;
  }

  try {
    const response = await getMyDevices();
    cache.devices = response.data.devices;
    cache.lastUpdated.devices = Date.now();
    return cache.devices;
  } catch (error) {
    return cache.devices || [];
  }
};

// Clear cache
export const clearCache = () => {
  cache.pets = null;
  cache.devices = null;
  cache.lastUpdated = {};
};

export default {
  // User APIs
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,

  // Pet APIs
  getPetsByUser,
  addPet,
  getPetById,
  deletePet,

  // Safe Zones APIs
  getPetSafeZones,
  addSafeZone,
  updateSafeZone,
  deleteSafeZone,

  // Pet Data APIs
  getLatestPetData,
  getAllPetData,

  // Device APIs
  registerDevice,
  getMyDevices,
  getPetByDevice,
  getDeviceConfig,
  updateDeviceSafeZones,
  getDeviceSafeZones,
  createMultipleSafeZones,

  // Utility Functions
  validateVietnamesePhone,
  formatPhoneDisplay,
  isTokenValid,
  refreshToken,
  calculateDistance,
  isPointInSafeZone,
  formatSafeZoneForDisplay,
  createDeviceConfig,

  // Status Checks
  checkServerStatus,
  checkMQTTStatus,

  // Batch Operations
  deleteMultipleSafeZones,
  updateMultipleSafeZones,

  // Data Export/Import
  exportSafeZones,
  importSafeZones,

  // Realtime & Cache
  startPolling,
  getCachedPets,
  getCachedDevices,
  clearCache,

  // Constants
  API_URL,
};
