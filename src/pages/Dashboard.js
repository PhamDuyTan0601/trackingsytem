import React, { useEffect, useState } from "react";
import { getPetsByUser, getAllPetData, deletePet } from "../api/api";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import RealTimeMap from "../components/RealTimeMap";
import DashboardStats from "../components/DashboardStats";
import AlertSystem from "../components/AlertSystem";
import "./Dashboard.css";

function Dashboard() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petData, setPetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const res = await getPetsByUser();
      const petsData = res.data.pets || [];
      setPets(petsData);

      if (petsData.length > 0) {
        setSelectedPet(petsData[0]);
        await fetchPetData(petsData[0]._id);
      }
    } catch (err) {
      console.error("Error loading pets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetData = async (petId) => {
    try {
      const res = await getAllPetData(petId);
      const data = res.data.data || [];
      setPetData(data);

      if (data.length === 0) {
        const sampleData = [
          {
            latitude: 10.8231,
            longitude: 106.6297,
            activityType: "walking",
            batteryLevel: 85,
            speed: 1.2,
            timestamp: new Date().toISOString(),
          },
        ];
        setPetData(sampleData);
      }
    } catch (err) {
      console.error("Error fetching pet data:", err);
      const sampleData = [
        {
          latitude: 10.8231,
          longitude: 106.6297,
          activityType: "walking",
          batteryLevel: 85,
          speed: 1.2,
          timestamp: new Date().toISOString(),
        },
      ];
      setPetData(sampleData);
    }
  };

  const handlePetSelect = async (pet) => {
    setSelectedPet(pet);
    await fetchPetData(pet._id);
  };

  const handleDeletePet = async (petId, petName) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa pet "${petName}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deletePet(petId);

      const updatedPets = pets.filter((pet) => pet._id !== petId);
      setPets(updatedPets);

      if (selectedPet && selectedPet._id === petId) {
        if (updatedPets.length > 0) {
          setSelectedPet(updatedPets[0]);
          await fetchPetData(updatedPets[0]._id);
        } else {
          setSelectedPet(null);
          setPetData([]);
        }
      }

      alert(`✅ Đã xóa pet "${petName}" thành công!`);
    } catch (error) {
      console.error("Error deleting pet:", error);

      let errorMessage = "Lỗi không xác định";

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "Không tìm thấy pet để xóa.";
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền xóa pet này.";
        } else {
          errorMessage =
            error.response.data?.message ||
            `Lỗi server: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến server.";
      } else {
        errorMessage = error.message;
      }

      alert(`❌ Lỗi khi xóa pet: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>🐾 Dashboard Theo Dõi Pet</h2>
          <Link to="/add-pet">
            <button>+ Thêm Pet Mới</button>
          </Link>
        </div>

        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : pets.length === 0 ? (
          <div className="no-pets">
            <p>Chưa có pet nào. Thêm pet đầu tiên của bạn!</p>
            <Link to="/add-pet">
              <button>Thêm Pet Đầu Tiên</button>
            </Link>
          </div>
        ) : (
          <>
            <div className="pet-selector">
              <label>Chọn Pet để theo dõi:</label>
              <select
                value={selectedPet?._id || ""}
                onChange={(e) => {
                  const pet = pets.find((p) => p._id === e.target.value);
                  if (pet) handlePetSelect(pet);
                }}
              >
                {pets.map((pet) => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} - {pet.species}
                  </option>
                ))}
              </select>
            </div>

            {selectedPet && (
              <>
                <DashboardStats petData={petData} selectedPet={selectedPet} />

                <div className="grid-layout">
                  <div className="map-section">
                    <h3>🗺️ Bản Đồ Theo Dõi Thời Gian Thực</h3>
                    <RealTimeMap petData={petData} selectedPet={selectedPet} />
                  </div>

                  <div className="alerts-section">
                    <AlertSystem petData={petData} selectedPet={selectedPet} />
                  </div>
                </div>

                <div className="pet-list-section">
                  <div className="section-header">
                    <h3>📋 Danh Sách Pets Của Bạn</h3>
                    <small>Tổng số: {pets.length} pet(s)</small>
                  </div>
                  <div className="pets-grid">
                    {pets.map((pet) => (
                      <div
                        key={pet._id}
                        className={`pet-card ${
                          selectedPet?._id === pet._id ? "active" : ""
                        }`}
                      >
                        <div
                          className="pet-info"
                          onClick={() => handlePetSelect(pet)}
                        >
                          <h4>{pet.name}</h4>
                          <p>
                            {pet.species} • {pet.breed}
                          </p>
                          <p>{pet.age} tuổi</p>
                          <div className="pet-status">
                            <span className="status-dot"></span>
                            <span>Đang hoạt động</span>
                          </div>
                        </div>
                        <div className="pet-actions">
                          <button
                            onClick={() => handleDeletePet(pet._id, pet.name)}
                            disabled={deleting}
                            className="delete-btn"
                            title="Xóa pet"
                          >
                            {deleting ? "⏳" : "🗑️"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;