// multerConfig.js
const aws = require('aws-sdk');
const multer = require('multer');
require('dotenv').config();

// AWS S3 Configuration
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: 'v4',
});

const s3 = new aws.S3();

// Multer Memory Storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

console.log("✅ Multer and AWS S3 configuration loaded successfully.");

const uploadToS3 = async (file) => {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        console.log("🔄 [S3 Upload] Starting upload with params:", params);

        const data = await s3.upload(params).promise();
        console.log("✅ [S3 Upload] Successful:", data.Location);
        return data.Location;
    } catch (err) {
        console.error("❌ [S3 Upload] Error:", err.message);
        throw err;
    }
};

module.exports = { upload, uploadToS3, s3 };
