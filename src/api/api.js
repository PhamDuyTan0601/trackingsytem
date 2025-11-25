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
// 📈 PET DATA APIs
// ===============================
export const getLatestPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}/latest`, getAuthHeader());

export const getAllPetData = async (petId) =>
  axios.get(`${API_URL}/api/petData/pet/${petId}`, getAuthHeader());

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

// ===============================
// 🧩 AXIOS INTERCEPTOR - CẢI THIỆN XỬ LÝ LỖI
// ===============================
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
    }

    return Promise.reject(error);
  }
);

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
