const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const manifestationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  workNotDoneTarget: {
    type: Number,
    required: true,
  },
  lateSubmissionTarget: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

manifestationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const getChecklistManifestModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("MISChecklistManifest", manifestationSchema);
};

module.exports = { getChecklistManifestModel };