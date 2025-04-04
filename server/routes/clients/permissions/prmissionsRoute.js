// const express = require("express");
// const dbMiddleware = require("../../../middlewares/dbMiddleware");

// const router = express.Router();

// router.get("/", dbMiddleware, async (req, res) => {
//   try {
//     const Permission = req.Permission;
//     const permissions = await Permission.find();
//     res.json(permissions);
//   } catch (error) {
//     console.error("❌ Error fetching all permissions:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// // Get permissions for a specific role
// router.get("/:role", dbMiddleware, async (req, res) => {
//   try {
//     const { role } = req.params;
//     const Permission = req.Permission;

//     const permission = await Permission.findOne({ role });
//     if (!permission) {
//       return res.status(404).json({ message: "Permissions not found for this role" });
//     }

//     res.json(permission);
//   } catch (error) {
//     console.error("❌ Error fetching permissions:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// // Create or update permissions for a role
// router.post("/", dbMiddleware, async (req, res) => {
//   try {
//     const Permission = req.Permission;
//     const { role, permissions } = req.body;

//     const updatedPermission = await Permission.findOneAndUpdate(
//       { role },
//       { $set: { permissions } },
//       { upsert: true, new: true }
//     );

//     res.json({ message: "Permissions saved successfully", updatedPermission });
//   } catch (error) {
//     console.error("❌ Error saving permissions:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// // Delete permissions for a specific role
// router.delete("/:role", dbMiddleware, async (req, res) => {
//   try {
//     const Permission = req.Permission;
//     const { role } = req.params;

//     const result = await Permission.deleteOne({ role });
//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: "Role not found" });
//     }

//     res.json({ message: "Permissions deleted successfully" });
//   } catch (error) {
//     console.error("❌ Error deleting permissions:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// module.exports = router;
