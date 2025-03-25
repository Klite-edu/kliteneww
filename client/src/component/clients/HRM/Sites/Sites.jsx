import React, { useState } from "react";
import axios from "axios";
import "./sites.css";

const Sites = () => {
  const [siteData, setSiteData] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSiteData({ ...siteData, [name]: value });
  };

  const handleSubmitSite = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/sites`,
        siteData
      );
      alert(response.data.message);
      setSiteData({ name: "", latitude: "", longitude: "", radius: "" });
    } catch (error) {
      console.error("Error adding site", error);
      alert("Failed to add site. Please try again.");
    }
  };

  return (
    <div className="site-config-container">
      <h2 className="config-title">Site Configuration</h2>
      <form className="site-form" onSubmit={handleSubmitSite}>
        <div className="form-group">
          <label>Site Name</label>
          <input
            type="text"
            name="name"
            value={siteData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Latitude</label>
          <input
            type="number"
            name="latitude"
            value={siteData.latitude}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Longitude</label>
          <input
            type="number"
            name="longitude"
            value={siteData.longitude}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Radius (meters)</label>
          <input
            type="number"
            name="radius"
            value={siteData.radius}
            onChange={handleInputChange}
            required
          />
        </div>
        <button className="submit-button" type="submit">
          Submit Site
        </button>
      </form>
    </div>
  );
};

export default Sites;