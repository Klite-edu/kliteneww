const express = require("express");
const Submission = require("../../../models/clients/form/form-model");
const Form = require("../../../models/clients/formBuilder/formBuilder-model");
const Trigger = require("../../../models/clients/triggers/Trigger-model");
const PipelineStage = require("../../../models/clients/pipeline/pipeline-model");
const verifyToken = require("../../../middlewares/auth");
const router = express.Router();
const mongoose = require("mongoose");
const { Types } = mongoose; // Import Types for ObjectId

router.post("/submit/:formId", async (req, res) => {
    const { formId } = req.params;
    const { submissions, user_email, data, _id, clientId } = req.body;
  
    console.log("\n========== New Form Submission Request ==========");
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);
  
    try {
      // ✅ Step 1️⃣: Validate formId
      console.log("Step 1️⃣: Validating formId:", formId);
      if (!mongoose.Types.ObjectId.isValid(formId)) {
        console.log("❌ Invalid form ID:", formId);
        return res.status(400).json({ error: "Invalid form ID", formId });
      }
  
      // ✅ Step 2️⃣: Find the form (using param or fallback _id from body)
      const lookupId = formId || _id;
      console.log("Step 2️⃣: Looking for form with ID:", lookupId);
      const form = await Form.findById(lookupId);
  
      if (!form) {
        console.log(`❌ Form not found with ID: ${lookupId}`);
        return res.status(404).json({ message: "Form not found", formId: lookupId });
      }
  
      console.log("✅ Form found:", {
        id: form._id,
        title: form.formInfo?.title,
        client: form.client,
        fields: form.fields.length,
      });
  
      // ✅ Step 3️⃣: Validate Client Access
      console.log("Step 3️⃣: Validating client access for clientId:", clientId);
  
      if (!form.client.includes(clientId)) {
        console.log(`❌ Unauthorized! ClientId ${clientId} is not in form.client`);
        return res.status(403).json({ error: "Unauthorized access to this form" });
      }
  
      console.log("✅ Client access validated");
  
      // ✅ Step 4️⃣: Validate Submissions Array
      console.log("Step 4️⃣: Validating submissions...");
      if (!Array.isArray(submissions) || submissions.length === 0) {
        console.log("❌ Invalid or empty submissions array");
        return res.status(400).json({ error: "Invalid submissions data" });
      }
  
      console.log(`✅ Submissions received: ${submissions.length} entries`);
  
      // ✅ Step 5️⃣: Match Submissions with Form Fields
      console.log("Step 5️⃣: Matching submission data with form fields...");
      const submissionData = submissions.map((submission) => {
        console.log("➡️ Validating submission field:", submission.fieldLabel);
        const field = form.fields.find((f) => f.label === submission.fieldLabel);
  
        if (!field) {
          const errorMessage = `❌ Field "${submission.fieldLabel}" not found in form`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
  
        console.log("✅ Field matched:", {
          label: submission.fieldLabel,
          type: field.type,
          submittedValue: submission.value,
        });
  
        return {
          fieldLabel: submission.fieldLabel,
          fieldType: field.type,
          value: submission.value,
        };
      });
  
      console.log("✅ Submission data mapped successfully:", submissionData);
  
      // ✅ Step 6️⃣: Create & Save New Submission (includes form_name)
      console.log("Step 6️⃣: Saving submission...");
  
      const newSubmission = await Submission.create({
        formId: form._id,
        clientId,  // ✅ passed from frontend
        form_name: form.formInfo.title,
        submissions: submissionData,
      });
  
      console.log("✅ Submission saved successfully:", {
        submissionId: newSubmission._id,
        formId: newSubmission.formId,
        clientId: newSubmission.clientId,
        totalFieldsSubmitted: newSubmission.submissions.length,
        form_name: newSubmission.form_name,
      });
  
      // ✅ Step 7️⃣: Fetch Triggers and Process (Optional)
      console.log("Step 7️⃣: Fetching triggers for event_source: form_submission");
  
      const triggers = await Trigger.find({ event_source: "form_submission" });
      console.log(`✅ Triggers fetched: ${triggers.length} triggers found`);
  
      for (const trigger of triggers) {
        console.log("➡️ Evaluating trigger:", trigger);
  
        if (trigger.conditions.form_id === lookupId.toString()) {
          console.log(`✅ Trigger matched for form_id: ${lookupId}`);
  
          console.log(
            "➡️ Looking for pipeline stage:",
            trigger.action.move_to_stage
          );
          const stage = await PipelineStage.findOne({
            stage_name: trigger.action.move_to_stage,
          });
  
          if (stage) {
            console.log("✅ Pipeline stage found:", {
              stageId: stage._id,
              stageName: stage.stage_name,
            });
  
            newSubmission.current_stage_id = stage._id;
            await newSubmission.save();
  
            console.log("✅ Submission moved to new stage:", stage.stage_name);
          } else {
            console.log(`❌ No stage found for: ${trigger.action.move_to_stage}`);
          }
        } else {
          console.log(`⚠️ Trigger condition not matched for form_id: ${lookupId}`);
        }
      }
  
      console.log("✅ All triggers evaluated successfully");
  
      // ✅ Final Response
      console.log("✅ Form submitted successfully. Sending response...");
  
      return res.status(201).json({
        message: "Form submitted successfully",
        submission: newSubmission,
      });
    } catch (error) {
      console.error("❌ Error submitting form:", error);
  
      return res.status(500).json({
        message: "Error submitting form",
        error: error.message,
      });
    } finally {
      console.log("========== End of Form Submission ==========\n");
    }
  });
  
router.get("/forms", async (req, res) => {
    try {
      console.log("🔎 Starting fetch for submissions...");
  
      // Step 1️⃣: Fetch unique formIds from Submissions
      const submissionForms = await Submission.find({}, { formId: 1 }).lean();
  
      console.log(`✅ Fetched ${submissionForms.length} submission entries`);
  
      // Step 2️⃣: Extract unique formIds (remove duplicates if any)
      const uniqueFormIds = [...new Set(submissionForms.map(sub => sub.formId.toString()))];
  
      console.log("✅ Unique formIds extracted:", uniqueFormIds);
  
      // Step 3️⃣: Fetch form titles from FormBuilder for each unique formId
      const formBuilders = await Form.find(
        { _id: { $in: uniqueFormIds } },
        { _id: 1, "formInfo.title": 1 }
      ).lean();
  
      console.log("✅ Fetched form names from FormBuilder:", formBuilders);
  
      // Step 4️⃣: Combine form_id and form_name
      const response = formBuilders.map(form => ({
        form_id: form._id,
        form_name: form.formInfo?.title || 'Untitled Form'
      }));
  
      console.log("✅ Final combined response:", response);
  
      return res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error fetching forms and names:", error);
  
      return res.status(500).json({
        message: "Error fetching forms and names",
        error: error.message
      });
    }
  });

  router.get("/leads-by-stages", async (req, res) => {
    try {
      console.log("Fetching triggers with event_source: form_submission...");
  
      // 1. Fetch triggers with event_source = "form_submission"
      const triggers = await Trigger.find({ event_source: "form_submission" });
      console.log("Triggers fetched successfully:", triggers);
  
      // 2. Fetch pipelines (includes stages array)
      const pipelines = await PipelineStage.find();
      console.log("Pipelines fetched successfully:", pipelines);
  
      // 3. Fetch all forms
      const forms = await Form.find(); // ✅ Your FormBuilder model
      console.log("Forms fetched successfully:", forms);
  
      // 4. Group submissions under stages using triggers
      const leadsByStages = await Promise.all(
        triggers.map(async (trigger) => {
          const { form_id } = trigger.conditions;
          const { move_to_stage } = trigger.action;
  
          console.log(`Fetching for form_id: ${form_id} and stage: ${move_to_stage}`);
  
          // Find the form from the forms list
          const form = forms.find((f) => f._id.equals(form_id));
          console.log("Form found:", form);
  
          if (!form) {
            console.log(`❌ Form not found: ${form_id}`);
            return null;
          }
  
          // Find the stage inside pipelines
          let foundStage = null;
  
          pipelines.forEach((pipeline) => {
            pipeline.stages.forEach((stage) => {
              if (stage._id.equals(move_to_stage)) {
                foundStage = stage;
              }
            });
          });
  
          console.log("Stage found:", foundStage);
  
          if (!foundStage) {
            console.log(`❌ Stage not found: ${move_to_stage}`);
            return null;
          }
  
          // ✅ Fetch submissions for this form
          const submissions = await Submission.find({ formId: form_id });
  
          console.log(`Submissions found for form ${form_id}:`, submissions.length);
  
          // ✅ Map each submission to { submission_id, submittedAt, data: {fieldLabel: value} }
          const leads = submissions.map((submission) => {
            const data = {};
  
            submission.submissions.forEach((fieldData) => {
              data[fieldData.fieldLabel] = fieldData.value;
            });
  
            return {
              submission_id: submission._id,
              submittedAt: submission.submittedAt,
              data: data,
            };
          });
          console.log("leads", leads);
          
  
          // ✅ Return leads directly under the stage
          return {
            stage: foundStage.stageName,
            leads: leads,
          };
        })
      );
  
      const filteredLeadsByStages = leadsByStages.filter((group) => group !== null);
  
      console.log("✅ Leads by stages fetched successfully:", filteredLeadsByStages);
      res.status(200).json(filteredLeadsByStages);
    } catch (error) {
      console.error("❌ Error fetching leads by stages:", error);
      res.status(500).json({
        message: "Error fetching leads by stages",
        error: error.message,
      });
    }
  });
  

module.exports = router;
