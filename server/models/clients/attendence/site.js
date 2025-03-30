const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, required: true },
});

const Site = mongoose.model("Site", SiteSchema);
module.exports = Site;

