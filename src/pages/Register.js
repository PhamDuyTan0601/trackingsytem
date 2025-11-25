import React, { useState } from "react";
import { registerUser } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify"; // dùng toast
import "./Auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // thêm phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate cơ bản
    if (!name || !email || !password || !phone) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    try {
      const res = await registerUser({ name, email, phone, password });
      if (res.data.success) {
        toast.success("✅ Tạo tài khoản thành công!");
        navigate("/login");
      } else {
        toast.error(res.data.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      toast.error("❌ Đăng ký thất bại. Vui lòng thử lại.");
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
          placeholder="Số điện thoại"
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
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo tài khoản..." : "Register"}
        </button>
      </form>
      <p>
        <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
      </p>
    </div>
  );
}

export default Register;
