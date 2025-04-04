// const mongoose = require("mongoose");

// // Permission Schema
// const permissionSchema = new mongoose.Schema({
//   role: { type: String, required: true },
//   permissions: {
//     dashboard: [String],   // e.g., ["read", "create", "edit", "delete"]
//     users: [String],       // e.g., ["read", "edit"]
//     settings: [String],    // e.g., ["read"]
//     tasks: [String],       // e.g., ["create", "delete"]
//   },
// }, { timestamps: true });

// // Dynamic Permission Model based on client DB
// const getPermissionModel = (db) => {
//   if (!db.models.Permission) {
//     return db.model("Permission", permissionSchema);
//   }
//   return db.models.Permission;
// };

// module.exports = { getPermissionModel};
