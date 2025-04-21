const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db"); // adjust path if needed

const UploadSchema = new mongoose.Schema({
  filename: String,
  link: String,
  userId: String,
  uploadedAt: { type: Date, default: Date.now }
});

// ✅ Function to get dynamic Session model
const getMicrosoftUploadModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MicrosoftUpload", UploadSchema);
};

module.exports = { getMicrosoftUploadModel };

