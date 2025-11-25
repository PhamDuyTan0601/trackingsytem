import axios from "axios";

// ===============================
// 🌐 CONFIG
// ===============================
const API_URL =
  process.env.REACT_APP_API_URL || "https://pettracking2.onrender.com";

// ===============================
// 👤 USER APIs
// ===============================

// Đăng ký tài khoản
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

// Xóa pet - SỬA LẠI THÀNH DELETE METHOD
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
// 🧩 AXIOS INTERCEPTOR
// ===============================
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Token expired or invalid. Logging out...");
      logoutUser();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
