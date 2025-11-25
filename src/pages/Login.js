import React, { useState } from "react";
import { loginUser } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify"; // ✅ Dùng toast thay alert
import "./Auth.css";

function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState(""); // Cho phép login bằng email hoặc phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!emailOrPhone || !password) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    try {
      const res = await loginUser({ email: emailOrPhone, password }); // backend vẫn nhận `email`
      if (res.data.success) {
        toast.success("✅ Đăng nhập thành công!");
        navigate("/dashboard");
      } else {
        toast.error(res.data.message || "Đăng nhập thất bại!");
      }
    } catch (err) {
      toast.error("❌ Đăng nhập thất bại. Kiểm tra lại thông tin!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login to Pet Tracker</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email hoặc Số điện thoại"
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          required
          disabled={loading}
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Login"}
        </button>
      </form>
      <p>
        <Link to="/register">Tạo tài khoản mới</Link>
      </p>
    </div>
  );
}

export default Login;
