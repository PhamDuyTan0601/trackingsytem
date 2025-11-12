import React, { useState } from "react";
import { resetPassword } from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import "./Auth.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await resetPassword(token, password);
      setMessage("✅ Password reset successful!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setMessage("❌ Failed to reset password. Token may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Enter new password (min 6 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {message && (
        <div className={message.includes("❌") ? "error" : "success"}>
          {message}
        </div>
      )}
    </div>
  );
}

export default ResetPassword;