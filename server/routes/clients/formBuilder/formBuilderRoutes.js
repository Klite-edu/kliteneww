const express = require("express");
const mongoose = require("mongoose");
const formBuilderDB = require("../../../models/clients/formBuilder/formBuilder-model");
const verifyToken = require("../../../middlewares/auth");

const router = express.Router();

// Create a form
router.post("/create", async (req, res) => {
    try {
      const { body } = req;
  
      // Get clientId from body (passed from frontend)
      const clientId = body.clientId;
  
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ error: "Invalid client ID" });
      }
  
      const fields = body.fields?.map(field => ({
        label: field.label || "Untitled",
        type: field.type || "text",
        options: field.options,
        required: field.required || false
      })).filter(field => field.label);
  
      const buttons = {
        BackgroundColor: body.buttons?.BackgroundColor || "#ffffff",
        color: body.buttons?.color || "#000000",
        borderColor: body.buttons?.borderColor || "",
        borderRadius: body.buttons?.borderRadius || "4px",
        borderWidth: body.buttons?.borderWidth || "1px",
        padding: body.buttons?.padding || "10px",
        margin: body.buttons?.margin || "5px",
        redirectLink: body.buttons?.redirectLink || "#",
        text: body.buttons?.text || "Submit"
      };
  
      const formInfo = {
        title: body.formInfo?.title || "Enquiry Form",
        color: body.formInfo?.color || "#2DAA9E",
        bgColor: body.formInfo?.bgColor || "#000000"
      };
  
      const policyInfo = {
        title: body.policyInfo?.title || "Policy",
        policyRedirectLink: body.policyInfo?.policyRedirectLink || "#",
        visibility: body.policyInfo?.visibility || false
      };
  
      const formSavedInfo = await formBuilderDB.create({
        client: [clientId], // <== Save the client ID here
        fields,
        buttons,
        formInfo,
        policyInfo
      });
  
      return res.status(200).json({
        message: 'Form data saved successfully',
        data: formSavedInfo
      });
    } catch (error) {
      console.error("Error in createFormBuilder:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  

// Fetch forms by user ID
router.get("/client/forms", verifyToken, async (req, res) => {
    try {
      const clientId = req.user.id; // from token payload (decoded)
  
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ error: "Invalid client ID" });
      }
  
      const forms = await formBuilderDB.find({ client: clientId });
  
      if (!forms.length) {
        return res.status(404).json({ message: "No forms found for this client" });
      }
  
      return res.status(200).json({ forms });
    } catch (error) {
      console.error("Error fetching forms by clientId:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  


// Get form by formId
router.get("/form/:formId",  async (req, res) => {
    try {
      const formInfo = await formBuilderDB.findById(req.params.formId);
  
      if (!formInfo) {
        return res.status(404).json({ error: "Form not found" });
      }
  
      return res.status(200).json({ form: formInfo });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  

// Delete form by formId
router.delete("/form/:formId", async (req, res) => {
  try {
    await formBuilderDB.findByIdAndDelete(req.params.formId);
    return res.status(200).json({ message: 'Form successfully deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete all forms by userId
router.delete("/user/:userId", async (req, res) => {
  try {
    await formBuilderDB.deleteMany({ user: req.params.userId });
    return res.status(200).json({ message: 'Forms successfully deleted by user ID' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update form by formId
router.put("/form/:formId", async (req, res) => {
  try {
    const updatedForm = await formBuilderDB.findByIdAndUpdate(req.params.formId, req.body, { new: true });
    return res.status(200).json({ message: 'Form successfully updated', form: updatedForm });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
