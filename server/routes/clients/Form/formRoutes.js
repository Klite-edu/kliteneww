const express = require("express");
const DBMiddleware = require("../../../middlewares/dbMiddleware")
const router = express.Router();
const mongoose = require("mongoose");
const { Types } = mongoose; // Import Types for ObjectId

// router.post("/submit/:formId", async (req, res) => {
//   const { formId } = req.params;
//   const { submissions, user_email, data, _id, clientId } = req.body;

//   console.log("\n========== New Form Submission Request ==========");
//   console.log("Request Params:", req.params);
//   console.log("Request Body:", req.body);

//   try {
//     // ✅ Step 1️⃣: Validate formId
//     console.log("Step 1️⃣: Validating formId:", formId);
//     if (!mongoose.Types.ObjectId.isValid(formId)) {
//       console.log("❌ Invalid form ID:", formId);
//       return res.status(400).json({ error: "Invalid form ID", formId });
//     }

//     // ✅ Step 2️⃣: Find the form (using param or fallback _id from body)
//     const lookupId = formId || _id;
//     console.log("Step 2️⃣: Looking for form with ID:", lookupId);
//     const form = await Form.findById(lookupId);

//     if (!form) {
//       console.log(`❌ Form not found with ID: ${lookupId}`);
//       return res
//         .status(404)
//         .json({ message: "Form not found", formId: lookupId });
//     }

//     console.log("✅ Form found:", {
//       id: form._id,
//       title: form.formInfo?.title,
//       client: form.client,
//       fields: form.fields.length,
//     });

//     // ✅ Step 3️⃣: Validate Client Access
//     console.log("Step 3️⃣: Validating client access for clientId:", clientId);

//     if (!form.client.includes(clientId)) {
//       console.log(
//         `❌ Unauthorized! ClientId ${clientId} is not in form.client`
//       );
//       return res
//         .status(403)
//         .json({ error: "Unauthorized access to this form" });
//     }

//     console.log("✅ Client access validated");

//     // ✅ Step 4️⃣: Validate Submissions Array
//     console.log("Step 4️⃣: Validating submissions...");
//     if (!Array.isArray(submissions) || submissions.length === 0) {
//       console.log("❌ Invalid or empty submissions array");
//       return res.status(400).json({ error: "Invalid submissions data" });
//     }

//     console.log(`✅ Submissions received: ${submissions.length} entries`);

//     // ✅ Step 5️⃣: Match Submissions with Form Fields
//     console.log("Step 5️⃣: Matching submission data with form fields...");
//     const submissionData = submissions.map((submission) => {
//       console.log("➡️ Validating submission field:", submission.fieldLabel);
//       const field = form.fields.find((f) => f.label === submission.fieldLabel);

//       if (!field) {
//         const errorMessage = `❌ Field "${submission.fieldLabel}" not found in form`;
//         console.error(errorMessage);
//         throw new Error(errorMessage);
//       }

//       console.log("✅ Field matched:", {
//         label: submission.fieldLabel,
//         type: field.type,
//         submittedValue: submission.value,
//       });

//       return {
//         fieldLabel: submission.fieldLabel,
//         fieldType: field.type,
//         value: submission.value,
//       };
//     });

//     console.log("✅ Submission data mapped successfully:", submissionData);

//     // ✅ Step 6️⃣: Create & Save New Submission (includes form_name)
//     console.log("Step 6️⃣: Saving submission...");

//     const newSubmission = await Submission.create({
//       formId: form._id,
//       clientId, // ✅ passed from frontend
//       form_name: form.formInfo.title,
//       submissions: submissionData,
//     });

//     console.log("✅ Submission saved successfully:", {
//       submissionId: newSubmission._id,
//       formId: newSubmission.formId,
//       clientId: newSubmission.clientId,
//       totalFieldsSubmitted: newSubmission.submissions.length,
//       form_name: newSubmission.form_name,
//     });

//     // ✅ Step 7️⃣: Fetch Triggers and Process (Optional)
//     console.log("Step 7️⃣: Fetching triggers for event_source: form_submission");

//     const triggers = await Trigger.find({ event_source: "form_submission" });
//     console.log(`✅ Triggers fetched: ${triggers.length} triggers found`);

//     for (const trigger of triggers) {
//       console.log("➡️ Evaluating trigger:", trigger);

//       if (trigger.conditions.form_id === lookupId.toString()) {
//         console.log(`✅ Trigger matched for form_id: ${lookupId}`);

//         console.log(
//           "➡️ Looking for pipeline stage:",
//           trigger.action.move_to_stage
//         );
//         const stage = await PipelineStage.findOne({
//           stage_name: trigger.action.move_to_stage,
//         });

//         if (stage) {
//           console.log("✅ Pipeline stage found:", {
//             stageId: stage._id,
//             stageName: stage.stage_name,
//           });

//           newSubmission.current_stage_id = stage._id;
//           await newSubmission.save();

//           console.log("✅ Submission moved to new stage:", stage.stage_name);
//         } else {
//           console.log(`❌ No stage found for: ${trigger.action.move_to_stage}`);
//         }
//       } else {
//         console.log(
//           `⚠️ Trigger condition not matched for form_id: ${lookupId}`
//         );
//       }
//     }

//     console.log("✅ All triggers evaluated successfully");

//     // ✅ Final Response
//     console.log("✅ Form submitted successfully. Sending response...");

//     return res.status(201).json({
//       message: "Form submitted successfully",
//       submission: newSubmission,
//     });
//   } catch (error) {
//     console.error("❌ Error submitting form:", error);

//     return res.status(500).json({
//       message: "Error submitting form",
//       error: error.message,
//     });
//   } finally {
//     console.log("========== End of Form Submission ==========\n");
//   }
// });

router.post("/submit/:formId",DBMiddleware, async (req, res) => {
  const { formId } = req.params;
  const { submissions, user_email, data, _id, clientId } = req.body;

  console.log("\n========== New Form Submission Request ==========");
  console.log("Request Params:", req.params);
  console.log("Request Body:", req.body);

  try {
    console.log("Step 1️⃣: Validating formId:", formId);
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      console.log("❌ Invalid form ID:", formId);
      return res.status(400).json({ error: "Invalid form ID", formId });
    }

    const lookupId = formId || _id;
    console.log("Step 2️⃣: Looking for form with ID:", lookupId);
    const form = await req.FormBuilder.findById(lookupId);

    if (!form) {
      console.log(`❌ Form not found with ID: ${lookupId}`);
      return res
        .status(404)
        .json({ message: "Form not found", formId: lookupId });
    }

    console.log("✅ Form found:", {
      id: form._id,
      title: form.formInfo?.title,
      client: form.client,
      fields: form.fields.length,
    });

    console.log("Step 3️⃣: Validating client access for clientId:", clientId);
    if (!form.client.includes(clientId)) {
      console.log(
        `❌ Unauthorized! ClientId ${clientId} is not in form.client`
      );
      return res
        .status(403)
        .json({ error: "Unauthorized access to this form" });
    }
    console.log("✅ Client access validated");

    console.log("Step 4️⃣: Validating submissions...");
    if (!Array.isArray(submissions) || submissions.length === 0) {
      console.log("❌ Invalid or empty submissions array");
      return res.status(400).json({ error: "Invalid submissions data" });
    }
    console.log(`✅ Submissions received: ${submissions.length} entries`);

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

    // Step 6️⃣: Get the initial stage from the trigger model based on the form
    console.log("Step 6️⃣: Fetching initial stage from trigger...");
    let initialStageId;

    const trigger = await req.trigger.findOne({
      event_source: "form_submission",
      "conditions.form_id": lookupId,
    });

    if (trigger && trigger.action.move_to_stage) {
      console.log("✅ Trigger found:", trigger);
      const stage = await req.pipeline.findOne({
        "stages._id": trigger.action.move_to_stage,
      });

      if (stage) {
        const initialStage = stage.stages.find(
          (s) => s._id.toString() === trigger.action.move_to_stage.toString()
        );

        if (initialStage) {
          initialStageId = initialStage._id;
          console.log(
            "✅ Initial stage set from trigger:",
            initialStage.stageName
          );
        } else {
          console.log("❌ No matching stage found in pipeline.");
          return res
            .status(400)
            .json({ message: "Invalid initial stage from trigger." });
        }
      } else {
        console.log("❌ No pipeline stage found for trigger.");
        return res.status(400).json({ message: "Pipeline stage not found." });
      }
    } else {
      console.log("❌ No trigger configured for initial stage.");
      return res
        .status(400)
        .json({ message: "No trigger found for form submission." });
    }

    // ✅ Step 7️⃣: Create & Save New Submission
    console.log("✅ Saving new submission...");
    const newSubmission = await req.Submission.create({
      formId: form._id,
      clientId,
      form_name: form.formInfo.title,
      submissions: submissionData,
      current_stage_id: initialStageId,
    });

    console.log("✅ Submission saved successfully:", {
      submissionId: newSubmission._id,
      formId: newSubmission.formId,
      clientId: newSubmission.clientId,
      totalFieldsSubmitted: newSubmission.submissions.length,
      form_name: newSubmission.form_name,
    });

    return res.status(201).json({
      message: "Form submitted successfully",
      submission: newSubmission,
    });
  } catch (error) {
    console.error("❌ Error submitting form:", error);
    return res
      .status(500)
      .json({ message: "Error submitting form", error: error.message });
  } finally {
    console.log("========== End of Form Submission ==========\n");
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

// router.get("/leads-by-stages", async (req, res) => {
//   try {
//     console.log("Fetching triggers with event_source: form_submission...");

//     // 1. Fetch triggers with event_source = "form_submission"
//     const triggers = await Trigger.find({ event_source: "form_submission" });
//     console.log("Triggers fetched successfully:", triggers);

//     // 2. Fetch pipelines (includes stages array)
//     const pipelines = await PipelineStage.find();
//     console.log("Pipelines fetched successfully:", pipelines);

//     // 3. Fetch all forms
//     const forms = await Form.find(); // ✅ Your FormBuilder model
//     console.log("Forms fetched successfully:", forms);

//     // 4. Group submissions under stages using triggers
//     const leadsByStages = await Promise.all(
//       triggers.map(async (trigger) => {
//         const { form_id } = trigger.conditions;
//         const { move_to_stage } = trigger.action;

//         console.log(
//           `Fetching for form_id: ${form_id} and stage: ${move_to_stage}`
//         );

//         // Find the form from the forms list
//         const form = forms.find((f) => f._id.equals(form_id));
//         console.log("Form found:", form);

//         if (!form) {
//           console.log(`❌ Form not found: ${form_id}`);
//           return null;
//         }

//         // Find the stage inside pipelines
//         let foundStage = null;

//         pipelines.forEach((pipeline) => {
//           pipeline.stages.forEach((stage) => {
//             if (stage._id.equals(move_to_stage)) {
//               foundStage = stage;
//             }
//           });
//         });

//         console.log("Stage found:", foundStage);

//         if (!foundStage) {
//           console.log(`❌ Stage not found: ${move_to_stage}`);
//           return null;
//         }

//         // ✅ Fetch submissions for this form
//         const submissions = await Submission.find({ formId: form_id });

//         console.log(
//           `Submissions found for form ${form_id}:`,
//           submissions.length
//         );

//         // ✅ Map each submission to { submission_id, submittedAt, data: {fieldLabel: value} }
//         const leads = submissions.map((submission) => {
//           const data = {};

//           submission.submissions.forEach((fieldData) => {
//             data[fieldData.fieldLabel] = fieldData.value;
//           });

//           return {
//             submission_id: submission._id,
//             submittedAt: submission.submittedAt,
//             data: data,
//           };
//         });
//         console.log("leads", leads);

//         // ✅ Return leads directly under the stage
//         return {
//           stage: foundStage.stageName,
//           leads: leads,
//         };
//       })
//     );

//     const filteredLeadsByStages = leadsByStages.filter(
//       (group) => group !== null
//     );

//     console.log(
//       "✅ Leads by stages fetched successfully:",
//       filteredLeadsByStages
//     );
//     res.status(200).json(filteredLeadsByStages);
//   } catch (error) {
//     console.error("❌ Error fetching leads by stages:", error);
//     res.status(500).json({
//       message: "Error fetching leads by stages",
//       error: error.message,
//     });
//   }
// });

router.get("/leads-by-stages", DBMiddleware, async (req, res) => {
  try {
    console.log("🚀 Fetching leads grouped by stages...");

    // Step 1: Fetch all pipelines (includes stages array)
    console.log("📥 Step 1: Fetching pipelines...");
    const pipelines = await req.pipeline.find();
    console.log(
      "✅ Pipelines fetched successfully. Total pipelines:",
      pipelines.length
    );

    pipelines.forEach((pipeline, index) => {
      console.log(`Pipeline ${index + 1}: ${pipeline.pipelineName}`);
      pipeline.stages.forEach((stage, idx) => {
        console.log(
          `  Stage ${idx + 1}: ${stage.stageName} (ID: ${stage._id})`
        );
      });
    });

    // Step 2: Fetch all submissions directly from the Submission model
    console.log("📥 Step 2: Fetching submissions...");
    const submissions = await req.Submission.find().lean();
    console.log(
      `✅ Submissions fetched successfully. Total submissions: ${submissions.length}`
    );

    // Log each submission with details
    submissions.forEach((submission, idx) => {
      console.log(`  Submission ${idx + 1}:`);
      console.log(`    ID: ${submission._id}`);
      console.log(`    Current Stage ID: ${submission.current_stage_id}`);
      console.log(`    Submitted At: ${submission.submittedAt}`);
      console.log("    Submission Data:");
      submission.submissions.forEach((fieldData, dataIdx) => {
        console.log(
          `      ${dataIdx + 1}. ${fieldData.fieldLabel}: ${fieldData.value}`
        );
      });
    });

    // Step 3: Group submissions under stages based on current_stage_id
    console.log("📂 Step 3: Grouping submissions under stages...");
    const leadsByStages = pipelines.flatMap((pipeline) =>
      pipeline.stages.map((stage) => {
        console.log(`🔍 Checking stage: ${stage.stageName} (ID: ${stage._id})`);

        // Filter submissions correctly using ObjectId comparison
        const stageLeads = submissions
          .filter((submission) => {
            // Comparing ObjectId as strings
            const match =
              String(submission.current_stage_id) === String(stage._id);
            console.log(
              `    Submission ID ${submission._id} - Matches: ${match}`
            );
            return match;
          })
          .map((submission) => {
            const data = {};
            submission.submissions.forEach((fieldData) => {
              data[fieldData.fieldLabel] = fieldData.value;
              console.log(
                `      Field: ${fieldData.fieldLabel}, Value: ${fieldData.value}`
              );
            });
            return {
              submission_id: submission._id,
              submittedAt: submission.submittedAt,
              data: data,
            };
          });

        console.log(
          `✅ Found ${stageLeads.length} leads for stage: ${stage.stageName}`
        );

        return {
          stage: stage.stageName,
          stage_id: stage._id,
          leads: stageLeads,
        };
      })
    );

    // Step 4: Filter out empty stages to return only populated ones
    const filteredLeadsByStages = leadsByStages.filter(
      (group) => group.leads && group.leads.length > 0
    );

    console.log("✅ Leads grouped successfully. Final result:");
    filteredLeadsByStages.forEach((group, groupIdx) => {
      console.log(`Group ${groupIdx + 1}:`);
      console.log(`  Stage: ${group.stage}`);
      console.log(`  Number of Leads: ${group.leads.length}`);
      group.leads.forEach((lead, leadIdx) => {
        console.log(`    Lead ${leadIdx + 1}:`);
        console.log(`      ID: ${lead.submission_id}`);
        console.log(`      Submitted At: ${lead.submittedAt}`);
        console.log("      Data:");
        Object.keys(lead.data).forEach((key) => {
          console.log(`        ${key}: ${lead.data[key]}`);
        });
      });
    });

    res.status(200).json(filteredLeadsByStages);
  } catch (error) {
    console.error("❌ Error fetching leads by stages:", error);
    res.status(500).json({
      message: "Error fetching leads by stages",
      error: error.message,
    });
  }
});

router.post("/move-to-next-stage",DBMiddleware, async (req, res) => {
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
