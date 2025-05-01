
const mongoose = require("mongoose");
const { createClientDatabase } = require("../../../database/db");

const formBuilderSchema = new mongoose.Schema({
  fields: [
    {
      label: { type: String, required: true },
      type: { type: String, required: true },
      fieldCategory: {
        type: String,
        required: true,
        enum: ["primary", "other"],
        default: "primary"
      },
      options: { type: [String], default: [] },
      required: { type: Boolean, default: false },
    },
  ],
  client: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clients",
      required: true,
    },
  ],
  buttons: {
    BackgroundColor: { type: String, required: true },
    color: { type: String, required: true },
    borderColor: { type: String },
    borderRadius: { type: String },
    borderWidth: { type: String },
    padding: { type: String },
    margin: { type: String },
    redirectLink: { type: String, required: true },
    text: { type: String, required: true },
  },
  formInfo: {
    title: { type: String, required: true, default: "Enquiry Form" },
    color: { type: String, required: true, default: "#2DAA9E" },
    bgColor: { type: String, required: true, default: "#000000" },
  },
  policyInfo: {
    title: { type: String },
    policyRedirectLink: { type: String },
    visibility: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

formBuilderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get the FormBuilder model from the dynamic database
const getFormBuilderModel = async (companyName) => {
  const clientDB = await createClientDatabase(companyName);
  return clientDB.model("FormBuilder", formBuilderSchema);
};

module.exports = { getFormBuilderModel };