const express = require("express");
const DBMiddleware = require("../../../middlewares/dbMiddleware");
const router = express.Router();
const mongoose = require("mongoose");
const checkPermission = require("../../../middlewares/PermissionAuth");
const { Types } = mongoose; // Import Types for ObjectId

router.post("/submit/:formId", DBMiddleware, async (req, res) => {
  const companyName = req.query.company || req.cookies.companyName;
  if (!companyName) {
    return res.status(400).json({ error: "Company name is missing" });
  }

  // Load Models
  const {
    getFormBuilderModel,
  } = require("../../../models/clients/formBuilder/formBuilder-model");
  const {
    getSubmissionModel,
  } = require("../../../models/clients/form/form-model");
  const { getClientModel } = require("../../../models/Admin/client-modal");
  const {
    getPipelineModel,
  } = require("../../../models/clients/pipeline/pipeline-model");
  const {
    getTriggerModel,
  } = require("../../../models/clients/triggers/Trigger-model");

  req.FormBuilder = await getFormBuilderModel(companyName);
  req.Submission = await getSubmissionModel(companyName);
  req.Client = await getClientModel(companyName);
  req.pipeline = await getPipelineModel(companyName);
  req.trigger = await getTriggerModel(companyName);

  const { formId } = req.params;
  const { submissions, user_email, data } = req.body; // ❌ clientId hata diya

  console.log("\n========== New Form Submission ==========");
  console.log({
    formId,
    user_email,
    submissionCount: submissions?.length,
  });

  try {
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res
        .status(400)
        .json({ error: "Invalid form ID format", details: { formId } });
    }

    const form = await req.FormBuilder.findById(formId);
    if (!form) {
      return res.status(404).json({
        message: "Form not found",
        formId,
      });
    }

    console.log("✅ Form found:", {
      id: form._id,
      title: form.formInfo?.title || "Untitled Form",
      fields: form.fields.length,
      access: form.client.length ? "Restricted" : "Public",
    });

    // 🎯 Get clientId from Client collection
    let clientRecord = await req.Client.findOne();
    if (!clientRecord) {
      return res.status(404).json({ error: "Client not found for company" });
    }
    const clientId = clientRecord._id; // ✅ Final clientId from DB

    // 🔹 Step 3: Client Access Check
    if (form.client?.length > 0) {
      if (!form.client.includes(clientId)) {
        return res.status(403).json({
          error: "Unauthorized access",
          details: { clientId, allowed: form.client },
        });
      }
    }

    // 🔹 Step 4 onwards -> Same jaise tumhara code hai
    if (!Array.isArray(submissions) || !submissions.length) {
      return res.status(400).json({ error: "Invalid or empty submissions" });
    }

    const processed = [];
    const missingFields = [];
    const invalidFields = [];

    for (const { fieldLabel, value, fieldCategory } of submissions) {
      const field = form.fields.find((f) => f.label === fieldLabel);
      if (!field) {
        missingFields.push(fieldLabel);
        continue;
      }

      if (field.required && !value) {
        invalidFields.push({
          field: fieldLabel,
          reason: "Required field empty",
        });
        continue;
      }

      if (field.type === "number" && isNaN(value)) {
        invalidFields.push({ field: fieldLabel, reason: "Expected number" });
        continue;
      }

      if (
        field.type === "select" &&
        field.options?.length &&
        !field.options.includes(value)
      ) {
        invalidFields.push({
          field: fieldLabel,
          reason: "Invalid select option",
        });
        continue;
      }

      processed.push({
        fieldLabel,
        fieldType: field.type,
        value,
        fieldCategory: fieldCategory || field.fieldCategory || "other",
      });
    }

    if (missingFields.length || invalidFields.length) {
      return res.status(400).json({
        error: "Submission validation failed",
        details: { missingFields, invalidFields },
      });
    }

    console.log("✅ Validated Submissions:", {
      total: processed.length,
    });

    let initialStageId = null;
    let initialStageName = "Default Stage";

    try {
      const trigger = await req.trigger.findOne({
        event_source: "form_submission",
        "conditions.form_id": formId,
      });

      if (trigger?.action?.move_to_stage) {
        const pipeline = await req.pipeline.findOne({
          "stages._id": trigger.action.move_to_stage,
        });
        const stage = pipeline?.stages.find(
          (s) => s._id.toString() === trigger.action.move_to_stage.toString()
        );
        if (stage) {
          initialStageId = stage._id;
          initialStageName = stage.stageName;
        }
      }
    } catch (e) {
      console.warn("⚠️ Trigger evaluation failed:", e.message);
    }

    const submissionPayload = {
      formId: form._id,
      clientId,
      userEmail: user_email,
      form_name: form.formInfo?.title || "Untitled Form",
      submissions: processed,
      current_stage_id: initialStageId,
      metadata: {
        fieldCategories: Object.fromEntries(
          processed.map((f) => [f.fieldLabel, f.fieldCategory])
        ),
      },
    };

    const created = await req.Submission.create(submissionPayload);

    console.log("✅ Submission Saved:", {
      id: created._id,
      form: created.form_name,
      stage: initialStageName,
    });

    return res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      submissionId: created._id,
      formId: created.formId,
      currentStage: initialStageName,
      fieldCategories: submissionPayload.metadata.fieldCategories,
    });
  } catch (err) {
    console.error("❌ Submission Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  } finally {
    console.log("========== End of Submission ==========\n");
  }
});

router.post("/public-submit/:formId", async (req, res) => {
  const companyName = req.query.company || req.cookies.companyName;
  if (companyName) {
    const {
      getFormBuilderModel,
    } = require("../../../models/clients/formBuilder/formBuilder-model");
    const {
      getSubmissionModel,
    } = require("../../../models/clients/form/form-model");
    const { getClientModel } = require("../../../models/Admin/client-modal");
    const {
      getPipelineModel,
    } = require("../../../models/clients/pipeline/pipeline-model");
    const {
      getTriggerModel,
    } = require("../../../models/clients/triggers/Trigger-model");

    req.FormBuilder = await getFormBuilderModel(companyName);
    req.Submission = await getSubmissionModel(companyName);
    req.pipeline = await getPipelineModel(companyName);
    req.Client = await getClientModel(companyName);
    req.trigger = await getTriggerModel(companyName);
  }

  const { formId } = req.params;
  const { submissions, user_email, data, clientId } = req.body;

  console.log("\n========== New Form Submission ==========");
  console.log({
    formId,
    clientId,
    user_email,
    submissionCount: submissions?.length,
  });

  try {
    // 🔹 Step 1: Validate Form ID
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res
        .status(400)
        .json({ error: "Invalid form ID format", details: { formId } });
    }

    // 🔹 Step 2: Get Form
    const form = await req.FormBuilder.findById(formId);
    if (!form) {
      return res.status(404).json({
        message: "Form not found",
        formId,
        suggestion: "Verify if the form exists and is accessible",
      });
    }

    console.log("✅ Form found:", {
      id: form._id,
      title: form.formInfo?.title || "Untitled Form",
      fields: form.fields.length,
      access: form.client.length ? "Restricted" : "Public",
    });
    let finalClientId = clientId; // frontend se agar aaya hai to use kar lo

    if (!finalClientId && req.Client) {
      const clientRecord = await req.Client.findOne();
      if (clientRecord) {
        finalClientId = clientRecord._id;
        console.log("✅ Auto Fetched ClientID:", finalClientId);
      } else {
        console.warn("⚠️ No client found for company:", companyName);
      }
    }

    // 🔹 Step 4: Validate Submissions
    if (!Array.isArray(submissions)) {
      return res.status(400).json({ error: "Submissions must be an array" });
    }
    if (!submissions.length) {
      return res
        .status(400)
        .json({ error: "At least one submission is required" });
    }

    // 🔹 Step 5: Process Submissions
    const processed = [];
    const missingFields = [];
    const invalidFields = [];

    for (const { fieldLabel, value, fieldCategory } of submissions) {
      const field = form.fields.find((f) => f.label === fieldLabel);
      if (!field) {
        missingFields.push(fieldLabel);
        continue;
      }

      if (field.required && !value) {
        invalidFields.push({
          field: fieldLabel,
          reason: "Required field is empty",
        });
        continue;
      }

      if (field.type === "number" && isNaN(value)) {
        invalidFields.push({ field: fieldLabel, reason: "Expected a number" });
        continue;
      }

      if (
        field.type === "select" &&
        field.options?.length &&
        !field.options.includes(value)
      ) {
        invalidFields.push({
          field: fieldLabel,
          reason: "Invalid select option",
          validOptions: field.options,
        });
        continue;
      }

      processed.push({
        fieldLabel,
        fieldType: field.type,
        value,
        fieldCategory: fieldCategory || field.fieldCategory || "other",
      });
    }

    if (missingFields.length || invalidFields.length) {
      return res.status(400).json({
        error: "Submission validation failed",
        details: { missingFields, invalidFields },
      });
    }

    console.log("✅ Validated Submissions:", {
      total: processed.length,
      categories: [...new Set(processed.map((s) => s.fieldCategory))],
    });

    // 🔹 Step 6: Determine Initial Stage via Trigger
    let initialStageId = null;
    let initialStageName = "Default Stage";

    try {
      const trigger = await req.trigger.findOne({
        event_source: "form_submission",
        "conditions.form_id": formId,
      });

      if (trigger?.action?.move_to_stage) {
        const pipeline = await req.pipeline.findOne({
          "stages._id": trigger.action.move_to_stage,
        });
        const stage = pipeline?.stages.find(
          (s) => s._id.toString() === trigger.action.move_to_stage.toString()
        );
        if (stage) {
          initialStageId = stage._id;
          initialStageName = stage.stageName;
        }
      }
    } catch (e) {
      console.warn("⚠️ Trigger evaluation failed:", e.message);
    }

    // 🔹 Step 7: Save Submission
    const submissionPayload = {
      formId: form._id,
      clientId: finalClientId,
      userEmail: user_email,
      form_name: form.formInfo?.title || "Untitled Form",
      submissions: processed,
      current_stage_id: initialStageId,
      metadata: {
        fieldCategories: Object.fromEntries(
          processed.map((f) => [f.fieldLabel, f.fieldCategory])
        ),
      },
    };

    const created = await req.Submission.create(submissionPayload);

    console.log("✅ Submission Saved:", {
      id: created._id,
      form: created.form_name,
      stage: initialStageName,
    });

    // 🔹 Step 8: Final Response
    return res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      submissionId: created._id,
      formId: created.formId,
      currentStage: initialStageName,
      fieldCategories: submissionPayload.metadata.fieldCategories,
    });
  } catch (err) {
    console.error("❌ Submission Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  } finally {
    console.log("========== End of Submission ==========\n");
  }
});

router.get("/forms", DBMiddleware, async (req, res) => {
  try {
    console.log("🔎 Starting fetch for submissions...");

    // Step 1️⃣: Fetch unique formIds from Submissions
    const submissionForms = await req.Submission.find({}, { formId: 1 }).lean();

    console.log(`✅ Fetched ${submissionForms.length} submission entries`);

    // Step 2️⃣: Extract unique formIds (remove duplicates if any)
    const uniqueFormIds = [
      ...new Set(submissionForms.map((sub) => sub.formId.toString())),
    ];

    console.log("✅ Unique formIds extracted:", uniqueFormIds);

    // Step 3️⃣: Fetch form titles from FormBuilder for each unique formId
    const formBuilders = await req.FormBuilder.find(
      { _id: { $in: uniqueFormIds } },
      { _id: 1, "formInfo.title": 1 }
    ).lean();

    console.log("✅ Fetched form names from FormBuilder:", formBuilders);

    // Step 4️⃣: Combine form_id and form_name
    const response = formBuilders.map((form) => ({
      form_id: form._id,
      form_name: form.formInfo?.title || "Untitled Form",
    }));

    console.log("✅ Final combined response:", response);

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Error fetching forms and names:", error);

    return res.status(500).json({
      message: "Error fetching forms and names",
      error: error.message,
    });
  }
});

router.get("/leads-by-stages", DBMiddleware, async (req, res) => {
  try {
    console.log("🚀 Fetching leads grouped by stages...");

    // Step 1: Fetch pipelines
    const pipelines = await req.pipeline.find();
    console.log("✅ Pipelines fetched:", pipelines.length);

    // Optional: Log pipeline & stage names
    pipelines.forEach((pipeline, i) => {
      console.log(`Pipeline ${i + 1}: ${pipeline.pipelineName}`);
      pipeline.stages.forEach((stage, j) => {
        console.log(`  Stage ${j + 1}: ${stage.stageName} (ID: ${stage._id})`);
      });
    });

    // Step 2: Fetch all submissions
    const submissions = await req.Submission.find().lean();
    console.log(`✅ Submissions fetched: ${submissions.length}`);

    // Step 3: Group submissions by stage
    const leadsByStages = pipelines.flatMap((pipeline) =>
      pipeline.stages.map((stage) => {
        const stageLeads = submissions
          .filter(
            (submission) =>
              String(submission.current_stage_id) === String(stage._id)
          )
          .map((submission, index) => {
            // Log each submission
            console.log(`📥 Submission ${index + 1}: ${submission._id}`);
            console.log(`    Stage ID: ${submission.current_stage_id}`);
            console.log(`    Submitted At: ${submission.submittedAt}`);
            console.log("    Fields:");

            // Build full field list with label, value, and category
            const data = submission.submissions.map((field, i) => {
              console.log(
                `      ${i + 1}. ${field.fieldLabel} | ${field.value} | ${
                  field.fieldCategory || "N/A"
                }`
              );
              return {
                fieldLabel: field.fieldLabel,
                value: field.value,
                category: field.fieldCategory || "N/A",
              };
            });

            return {
              submission_id: submission._id,
              submittedAt: submission.submittedAt,
              data,
              category: "N/A", // optional category label
            };
          });

        console.log(
          `✅ Stage: ${stage.stageName} → ${stageLeads.length} leads`
        );

        return {
          stage: stage.stageName,
          stage_id: stage._id,
          leads: stageLeads,
        };
      })
    );

    // Step 4: Filter out empty stages
    const result = leadsByStages.filter((stage) => stage.leads.length > 0);

    // Final logging
    console.log("✅ Final grouped leads:");
    result.forEach((group, gIndex) => {
      console.log(`Stage ${gIndex + 1}: ${group.stage}`);
      group.leads.forEach((lead, lIndex) => {
        console.log(`  Lead ${lIndex + 1}: ${lead.submission_id}`);
        lead.data.forEach((f) => {
          console.log(`    ${f.fieldLabel} = ${f.value} [${f.category}]`);
        });
      });
    });

    // Send response
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error in /leads-by-stages:", error);
    return res.status(500).json({
      message: "Error fetching leads by stages",
      error: error.message,
    });
  }
});

router.post("/move-to-next-stage", DBMiddleware, async (req, res) => {
  // Start transaction logging
  console.log("🚀 Starting move-to-next-stage process", {
    timestamp: new Date().toISOString(),
    requestBody: req.body,
  });

  const { submissionId, currentStageId } = req.body;

  try {
    // Validate input
    console.log("🔍 Validating input parameters");
    if (!submissionId || !currentStageId) {
      console.error("❌ Missing required parameters:", {
        submissionId: submissionId ? "provided" : "missing",
        currentStageId: currentStageId ? "provided" : "missing",
      });
      return res.status(400).json({
        message: "Both submissionId and currentStageId are required",
      });
    }

    // Fetch submission
    console.log("📥 Fetching submission with ID:", submissionId);
    const submission = await req.Submission.findById(submissionId);

    if (!submission) {
      console.error("❌ Submission not found with ID:", submissionId);
      return res.status(404).json({ message: "Submission not found" });
    }
    console.log("✅ Found submission:", {
      id: submission._id,
      name: submission.name || "Unnamed submission",
      currentStage: submission.current_stage_id,
    });

    // Validate stage ID format
    console.log("🔍 Validating stage ID format");
    if (!mongoose.Types.ObjectId.isValid(currentStageId)) {
      console.error("❌ Invalid stage ID format:", currentStageId);
      return res.status(400).json({
        message: "Invalid current stage ID format",
        receivedValue: currentStageId,
      });
    }

    // Fetch pipeline containing the stage
    console.log("📥 Searching for pipeline containing stage:", currentStageId);
    const pipeline = await req.pipeline.findOne({
      "stages._id": new mongoose.Types.ObjectId(currentStageId),
    });

    if (!pipeline) {
      console.error("❌ Pipeline not found containing stage:", currentStageId);
      return res.status(404).json({
        message: "Pipeline not found for the given stage",
        stageId: currentStageId,
      });
    }
    console.log("✅ Found pipeline:", {
      id: pipeline._id,
      name: pipeline.pipelineName,
      totalStages: pipeline.stages.length,
    });

    // Find current stage position
    console.log("🔍 Locating current stage in pipeline");
    const currentStageIndex = pipeline.stages.findIndex(
      (stage) => stage._id.toString() === currentStageId
    );

    if (currentStageIndex === -1) {
      console.error("❌ Stage not found in pipeline stages", {
        stageId: currentStageId,
        availableStageIds: pipeline.stages.map((s) => s._id.toString()),
      });
      return res.status(400).json({
        message: "Stage ID not found in pipeline",
        pipelineId: pipeline._id,
      });
    }

    const currentStage = pipeline.stages[currentStageIndex];
    console.log("📍 Current stage position:", {
      index: currentStageIndex,
      name: currentStage.stageName,
      isFinal: currentStageIndex === pipeline.stages.length - 1,
    });

    // Check final stage
    if (currentStageIndex === pipeline.stages.length - 1) {
      console.warn("⚠️ Already at final stage:", currentStage.stageName);
      return res.status(400).json({
        message: "Already at the final stage",
        currentStage: {
          _id: currentStage._id,
          name: currentStage.stageName,
        },
      });
    }

    // Get next stage
    const nextStage = pipeline.stages[currentStageIndex + 1];
    if (!nextStage) {
      console.error("❌ Next stage not found at index:", currentStageIndex + 1);
      return res.status(404).json({
        message: "Next stage not found",
        currentStageIndex,
        totalStages: pipeline.stages.length,
      });
    }
    console.log("➡️ Next stage identified:", {
      id: nextStage._id,
      name: nextStage.stageName,
      index: currentStageIndex + 1,
    });

    // Log before state
    console.log("🔄 Preparing to update submission", {
      before: {
        stageId: submission.current_stage_id,
        stageName: pipeline.stages.find((s) =>
          s._id.equals(submission.current_stage_id)
        )?.stageName,
      },
      after: {
        stageId: nextStage._id,
        stageName: nextStage.stageName,
      },
    });

    // Update submission
    submission.current_stage_id = nextStage._id;
    await submission.save();

    // Log after state
    console.log("✅ Successfully updated submission", {
      submissionId: submission._id,
      newStage: {
        id: nextStage._id,
        name: nextStage.stageName,
      },
      pipeline: {
        id: pipeline._id,
        name: pipeline.pipelineName,
      },
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Moved to next stage successfully",
      data: {
        submissionId: submission._id,
        previousStage: {
          _id: currentStage._id,
          name: currentStage.stageName,
        },
        currentStage: {
          _id: nextStage._id,
          name: nextStage.stageName,
        },
        pipeline: {
          _id: pipeline._id,
          name: pipeline.pipelineName,
        },
      },
    });
  } catch (error) {
    console.error("💥 Critical error in move-to-next-stage:", {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      request: {
        body: req.body,
        params: req.params,
      },
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  } finally {
    console.log("🏁 Completed move-to-next-stage transaction");
  }
});

module.exports = router;
