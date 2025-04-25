const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const GoogleUserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  accessToken: String,
  refreshToken: String, // ✅ NEW
  files: [
    {
      fileId: String,
      fileName: String,
      mimeType: String,
      viewLink: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const getGoogleUserModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("GoogleUser", GoogleUserSchema);
};

module.exports = { getGoogleUserModel };
