import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLatestPetData } from "../api/api";
import Navbar from "../components/Navbar";
import "./PetDetail.css";

function PetDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getLatestPetData(id);
        setData(res.data.data);
        setError("");
      } catch (err) {
        setError("Failed to load pet data");
        console.error("Error fetching pet data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <>
      <Navbar />
      <div className="pet-detail-container">
        <h2>Pet Latest Data</h2>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}

        {data ? (
          <div className="pet-data">
            <p>
              <strong>Latitude:</strong> 
              <span>{data.latitude}</span>
            </p>
            <p>
              <strong>Longitude:</strong>
              <span>{data.longitude}</span>
            </p>
            <p>
              <strong>Speed:</strong>
              <span>{data.speed} m/s</span>
            </p>
            <p>
              <strong>Activity:</strong>
              <span className={`activity ${data.activityType}`}>
                {data.activityType}
              </span>
            </p>
            <p>
              <strong>Battery:</strong>
              <span>{data.batteryLevel}%</span>
            </p>
            <p>
              <strong>Last Updated:</strong>
              <span>{new Date(data.timestamp).toLocaleString()}</span>
            </p>
          </div>
        ) : (
          !loading && <p>No data available for this pet.</p>
        )}
      </div>
    </>
  );
}

export default PetDetail;