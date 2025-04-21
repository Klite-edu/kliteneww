require("dotenv").config();
const mongoose = require("mongoose");

const dbConnections = {};

// Main DB Connection for Admin Data
const connectMainDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to Main MongoDB successfully!");
  } catch (error) {
    console.error("❌ Main MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Sanitize company name for database name creation
const sanitizeDBName = (name) => {
  return name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
};

// Create or Get Dynamic Client Database
// Create or Get Dynamic Client Database
const createClientDatabase = async (companyName) => {
  if (!companyName) {
    console.error("❌ Error: Company name is undefined or empty in createClientDatabase");
    throw new Error("Company name cannot be empty or undefined");
  }

  const sanitizedCompanyName = sanitizeDBName(companyName);
  const dbName = `client_db_${sanitizedCompanyName}`;

  if (dbConnections[dbName]) {
    return dbConnections[dbName];
  }

  try {
    const connection = await mongoose.createConnection(
      `mongodb://admin:KliteEducation%402025@194.164.148.132:27017/${dbName}?authSource=admin`
    );
    dbConnections[dbName] = connection;
    console.log(`✅ Created/Connected to database: ${dbName}`);
    return connection;
  } catch (error) {
    console.error(`❌ Error creating client database ${dbName}:`, error);
    throw new Error("Database creation failed");
  }
};


// Fetch all client database names using the main admin DB connection
const getAllClientDBNames = async () => {
  try {
    // Use native MongoDB client to list databases
    const client = await mongoose.connect(process.env.MONGO_URI);
    const adminDb = client.connection.client.db().admin();
    const clientDBs = await adminDb.listDatabases();

    // Filter databases that start with "client_db_"
    return clientDBs.databases
      .map((db) => db.name)
      .filter((name) => name.startsWith("client_db_"));
  } catch (error) {
    console.error("❌ Error fetching client databases:", error);
    return [];
  }
};

module.exports = { connectMainDB, createClientDatabase, getAllClientDBNames };
