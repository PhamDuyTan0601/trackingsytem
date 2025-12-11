import React, { useState } from "react";
import { registerUser } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePhone = (phone) => {
    const phoneRegex =
      /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate cơ bản
    if (!name || !email || !password || !phone) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    // Validate số điện thoại
    if (!validatePhone(phone)) {
      toast.error(
        "Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam."
      );
      setLoading(false);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ!");
      setLoading(false);
      return;
    }

    try {
      const res = await registerUser({ name, email, phone, password });
      if (res.data.success) {
        toast.success("Tạo tài khoản thành công!");
        navigate("/login");
      } else {
        toast.error(res.data.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Tạo tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          placeholder="Số điện thoại (VD: 0912345678 hoặc +84912345678)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={loading}
        />
        <input
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength="6"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
      </form>
      <p>
        <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
      </p>
    </div>
  );
}

export default Register;
