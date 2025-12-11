import React, { useState } from "react";
import { addPet } from "../api/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./AddPet.css";

function AddPet() {
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addPet(form);
      alert("Pet added successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert(" Error adding pet. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="add-pet-container">
        <h2>Add New Pet</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Pet Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            disabled={loading}
          />
          <input
            placeholder="Species (dog, cat, bird, etc.)"
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            required
            disabled={loading}
          />
          <input
            placeholder="Breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            required
            disabled={loading}
          />
          <input
            placeholder="Age (years)"
            type="number"
            min="0"
            max="50"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Adding Pet..." : "Add Pet"}
          </button>
        </form>
      </div>
    </>
  );
}

export default AddPet;
