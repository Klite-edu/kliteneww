const express = require("express");
const { upload, uploadToS3 , s3 } = require("../../../config/multerConfig");
const dbMiddleware = require("../../../middlewares/dbMiddleware");
const router = express.Router();
const mongoose = require("mongoose");
router.post(
  "/upload",
  dbMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("🟢 [UPLOAD IMAGE] Request received.");

      if (!req.file) {
        console.error("❌ [UPLOAD IMAGE] No file received.");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("📂 [UPLOAD IMAGE] File received:", req.file);

      // Upload to S3 and get the URL
      const imageUrl = await uploadToS3(req.file);
      if (!imageUrl) {
        console.error("❌ [UPLOAD IMAGE] Failed to get image URL from S3.");
        return res.status(500).json({ message: "S3 upload failed" });
      }

      console.log("🌐 [UPLOAD IMAGE] Image URL:", imageUrl);

      // Check if req.user exists and has a valid _id
      const uploadedBy = req.user && req.user._id ? req.user._id : new mongoose.Types.ObjectId();
      console.log(`👤 [UPLOAD IMAGE] Uploaded by: ${uploadedBy}`);

      console.log("🔄 [S3 Upload] Uploading image to S3...");
      const newImage = new req.image({
        imageUrl,
        uploadedBy,
      });

      console.log("💾 [UPLOAD IMAGE] Saving image data to the database...");
      await newImage.save();
      console.log(
        `✅ [UPLOAD IMAGE] Image uploaded successfully for company: ${req.companyName}`
      );
      res.json({ message: "Image uploaded successfully", imageUrl });
    } catch (error) {
      console.error("❌ [UPLOAD IMAGE] Error uploading image:", error.message);
      res
        .status(500)
        .json({ message: "Image upload failed", error: error.message });
    }
  }
);

// ✅ Fetch All Images
router.get("/list", dbMiddleware, async (req, res) => {
  try {
    const images = await req.image.find();
    console.log("📸 [FETCH IMAGES] Retrieved images:", images);
    res.json(images);
  } catch (error) {
    console.error("❌ [FETCH IMAGES] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch images" });
  }
});

router.delete("/delete/:key", dbMiddleware, async (req, res) => {
  const { key } = req.params;
  console.log("🟢 [DELETE IMAGE] Request received for image key:", key);

  try {
    // Find the image by key in the database
    const imageToDelete = await req.image.findOne({ imageUrl: new RegExp(key) });

    if (!imageToDelete) {
      console.warn("⚠️ [DELETE IMAGE] Image not found:", key);
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from S3 using the key
    await s3
      .deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      })
      .promise();

    // Delete from the database
    await req.image.findByIdAndDelete(imageToDelete._id);
    console.log(`✅ [DELETE IMAGE] Deleted image: ${key}`);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("❌ [DELETE IMAGE] Error:", error.message);
    res.status(500).json({ message: "Failed to delete image", error: error.message });
  }
});
module.exports = router;
