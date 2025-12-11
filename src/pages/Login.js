import React, { useState } from "react";
import { loginUser } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Auth.css";

function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
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
      // Gửi cả email và số điện thoại dưới dạng "email" field
      // Backend sẽ tự động detect là email hay số điện thoại
      const res = await loginUser({ email: emailOrPhone, password });

      if (res.data.success) {
        toast.success(" Đăng nhập thành công!");
        navigate("/dashboard");
      } else {
        toast.error(res.data.message || "Đăng nhập thất bại!");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        " Đăng nhập thất bại. Kiểm tra lại thông tin!";
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Đăng nhập Pet Tracker</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email "
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
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
      <p>
        <Link to="/register">Tạo tài khoản mới</Link>
      </p>
    </div>
  );
}

export default Login;
