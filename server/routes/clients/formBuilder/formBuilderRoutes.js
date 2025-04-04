const express = require("express");
const mongoose = require("mongoose");
const DBMiddleware = require("../../../middlewares/dbMiddleware");

const router = express.Router();

// Create a form
router.post("/create", DBMiddleware, async (req, res) => {
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
  
      const formSavedInfo = await req.FormBuilder.create({
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
  

  router.get("/forms", DBMiddleware, async (req, res) => {
    try {
      const forms = await req.FormBuilder
        .find({})
        .sort({ _id: -1 }) // Sort by most recent first
        .lean();
  
      if (!forms || forms.length === 0) {
        return res.status(404).json({ message: "No forms found" });
      }
  
      return res.status(200).json({
        success: true,
        total: forms.length,
        forms,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching forms",
        error: error.message,
      });
    }
  });

  router.get("/formDetails", DBMiddleware, async (req, res) => {
    try {
        console.log("🔍 [FormBuilder] Fetching all forms from database");

        // Find all forms and exclude the version key
        const forms = await req.FormBuilder.find({})
            .select('-__v')
            .lean();

        if (!forms || forms.length === 0) {
            console.log("ℹ️ [FormBuilder] No forms found in database");
            return res.status(200).json({
                success: true,
                message: "No forms found",
                data: []
            });
        }

        console.log(`✅ [FormBuilder] Successfully fetched ${forms.length} forms`);

        return res.status(200).json({
            success: true,
            message: "Forms fetched successfully",
            count: forms.length,
            data: forms.map(form => ({
                _id: form._id,
                fields: form.fields,
                client: form.client,
                buttons: form.buttons,
                formInfo: form.formInfo,
                policyInfo: form.policyInfo,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            }))
        });

    } catch (error) {
        console.error("❌ [FormBuilder] Error fetching all forms:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while fetching forms",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
  


// Get form by formId
router.get("/form/:id", DBMiddleware, async (req, res) => {
    try {
      const formInfo = await req.FormBuilder.findById(req.params.id);
  
      if (!formInfo) {
        return res.status(404).json({ error: "Form not found" });
      }
  
      return res.status(200).json({ form: formInfo });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  

// Delete form by formId
router.delete("/form/:formId", DBMiddleware , async (req, res) => {
  try { 
    await req.FormBuilder.findByIdAndDelete(req.params.formId);
    return res.status(200).json({ message: 'Form successfully deleted' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete all forms by userId
router.delete("/user/:userId", DBMiddleware, async (req, res) => {
  try {
    await req.FormBuilder.deleteMany({ user: req.params.userId });
    return res.status(200).json({ message: 'Forms successfully deleted by user ID' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update form by formId
router.put("/form/:formId",DBMiddleware, async (req, res) => {
  try {
    const updatedForm = await req.FormBuilder.findByIdAndUpdate(req.params.formId, req.body, { new: true });
    return res.status(200).json({ message: 'Form successfully updated', form: updatedForm });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
