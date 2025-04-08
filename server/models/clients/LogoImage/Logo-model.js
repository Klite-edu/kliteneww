const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

// Define Image Schema
const ImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clients",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the timestamp
ImageSchema.pre("save", function (next) {
  this.uploadedAt = Date.now();
  next();
});

// Function to get the Image model from the dynamic database
const getImageModel = async (companyName) => {
  try {
    const clientDB = await createClientDatabase(companyName);
    return clientDB.model("Image", ImageSchema);
  } catch (error) {
    console.error(
      `❌ Error creating Image model for company: ${companyName}`,
      error
    );
    throw new Error("Failed to connect to the client database");
  }
};

module.exports = { getImageModel };
