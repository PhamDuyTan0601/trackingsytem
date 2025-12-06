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
    // Không throw error để tránh crash, chỉ log warning
    return {};
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ===============================
// 🧑‍💼 USER APIs
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
  window.location.href = "/login";
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
// 🛡️ SAFE ZONE APIs (MỚI)
// ===============================

// Lấy danh sách safe zones của pet
export const getSafeZones = async (petId) =>
  axios.get(`${API_URL}/api/pets/${petId}/safe-zones`, getAuthHeader());

// Thêm safe zone mới
export const addSafeZone = async (petId, safeZoneData) =>
  axios.post(
    `${API_URL}/api/pets/${petId}/safe-zones`,
    safeZoneData,
    getAuthHeader()
  );

// Cập nhật safe zone
export const updateSafeZone = async (petId, zoneId, updateData) =>
  axios.put(
    `${API_URL}/api/pets/${petId}/safe-zones/${zoneId}`,
    updateData,
    getAuthHeader()
  );

// Toggle trạng thái active/inactive của safe zone
export const toggleSafeZone = async (petId, zoneId) =>
  axios.patch(
    `${API_URL}/api/pets/${petId}/safe-zones/${zoneId}/toggle`,
    {},
    getAuthHeader()
  );

// Xóa safe zone
export const deleteSafeZone = async (petId, zoneId) =>
  axios.delete(
    `${API_URL}/api/pets/${petId}/safe-zones/${zoneId}`,
    getAuthHeader()
  );

// ===============================
// 📈 PET DATA APIs
// ===============================

// Lấy dữ liệu mới nhất của pet
export const getLatestPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}/latest`, getAuthHeader());

// Lấy tất cả dữ liệu của pet
export const getAllPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}`, getAuthHeader());

// Lấy dữ liệu trong khoảng thời gian
export const getPetDataInRange = async (petId, startDate, endDate) =>
  axios.get(
    `${API_URL}/api/petData/pet/${petId}?start=${startDate}&end=${endDate}`,
    getAuthHeader()
  );

// ===============================
// 📱 DEVICE APIs
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

// 🆕 ESP32 lấy cấu hình (petId, phoneNumber, safeZone, v.v.)
export const getDeviceConfig = async (deviceId) =>
  axios.get(`${API_URL}/api/devices/config/${deviceId}`);

// Test ESP32 config endpoint (dùng để debug)
export const testDeviceConfig = async (deviceId) => {
  try {
    const response = await getDeviceConfig(deviceId);
    console.log("✅ Device Config Response:", response.data);
    return response;
  } catch (error) {
    console.error(
      "❌ Device Config Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// ===============================
// 🧩 AXIOS INTERCEPTOR - CẢI THIỆN XỬ LÝ LỖI
// ===============================

// Tạo instance axios mới để tránh ảnh hưởng đến các request khác
const apiInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data || error.message
    );

    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired or invalid. Logging out...");
      logoutUser();
      window.location.href = "/login";
    }

    // Xử lý lỗi 403 - Forbidden
    if (error.response?.status === 403) {
      alert("⛔ Bạn không có quyền truy cập tài nguyên này!");
    }

    // Xử lý lỗi 404 - Not Found
    if (error.response?.status === 404) {
      console.warn("📭 Resource not found:", error.config.url);
    }

    // Xử lý lỗi 500 - Server Error
    if (error.response?.status === 500) {
      console.error("🔥 Server internal error");
      alert("🚨 Máy chủ đang gặp sự cố. Vui lòng thử lại sau!");
    }

    // Xử lý lỗi mạng
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNREFUSED") {
      console.error("🌐 Network error - Cannot connect to server");
      alert(
        "🔌 Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet!"
      );
    }

    // Xử lý timeout
    if (error.code === "ECONNABORTED") {
      console.error("⏰ Request timeout");
      alert("⏳ Yêu cầu quá thời gian chờ. Vui lòng thử lại!");
    }

    return Promise.reject(error);
  }
);

// Export apiInstance cho các component muốn dùng trực tiếp
export { apiInstance };

// ===============================
// 🛠️ UTILITY FUNCTIONS
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
  // Format: 0912 345 678 hoặc +84 912 345 678
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
    // Kiểm tra cơ bản token (không verify signature)
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

// Lấy deviceId từ URL parameters (cho ESP32)
export const getDeviceIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("deviceId") || params.get("device_id") || null;
};

// Helper để tính khoảng cách giữa 2 điểm (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Format response data cho ESP32 (giống backend response)
export const formatESP32Config = (configData) => {
  return {
    deviceId: configData.deviceId,
    petId: configData.petId,
    petName: configData.petName,
    phoneNumber: configData.phoneNumber,
    ownerName: configData.ownerName,
    serverUrl: configData.serverUrl || API_URL,
    updateInterval: configData.updateInterval || 30000,
    safeZone: configData.safeZone, // Bao gồm center và radius
    timestamp: new Date().toISOString(),
  };
};

// Debug: In tất cả API endpoints
export const debugAPIEndpoints = () => {
  console.log("🔧 API Endpoints Debug:");
  console.log("Base URL:", API_URL);
  console.log("User Register:", `${API_URL}/api/users/register`);
  console.log("User Login:", `${API_URL}/api/users/login`);
  console.log("User Profile:", `${API_URL}/api/users/profile`);
  console.log("Pets:", `${API_URL}/api/pets/my-pets`);
  console.log("Safe Zones:", `${API_URL}/api/pets/{petId}/safe-zones`);
  console.log("Pet Data:", `${API_URL}/api/petData/pet/{petId}`);
  console.log("Device Register:", `${API_URL}/api/devices/register`);
  console.log("Device Config:", `${API_URL}/api/devices/config/{deviceId}`);
  console.log(
    "Auth Token:",
    localStorage.getItem("token") ? "✅ Present" : "❌ Missing"
  );
  console.log("Current User:", getCurrentUser());
};

export default apiInstance;
