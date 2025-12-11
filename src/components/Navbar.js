import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/api";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/dashboard" className="navbar-link">
          Dashboard
        </Link>
        <Link to="/add-pet" className="navbar-link">
          Add Pet
        </Link>
        <Link to="/devices" className="navbar-link">
          Devices
        </Link>
      </div>

      <div className="navbar-right">
        {user.name && (
          <div className="user-info">
            <span className="navbar-greeting"> , {user.name}</span>
            {user.phone && <span className="navbar-phone"> {user.phone}</span>}
          </div>
        )}
        {token && (
          <button onClick={handleLogout} className="navbar-logout-btn">
            Đăng xuất
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
