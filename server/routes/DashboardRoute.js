const express = require("express");
const router = express.Router();
const AdminDashboard = require("../models/admin-dashboard");

router.get("/company", async (req, res) => {
    try {
      const companyData = await AdminDashboard.findOne(); // Fetch the first company in the DB
      res.json(companyData);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error });
    }
  });

module.exports = router;
