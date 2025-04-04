const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const SiteSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SiteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the Site model from the dynamic database
const getSiteModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("Site", SiteSchema);
};

module.exports = { getSiteModel };
