const express = require("express");
// const Ticket = require("../../../models/clients/TicketRaise/TicketRaise-model");
const router = express.Router();
const dbDBMiddleware = require("../../../middlewares/dbMiddleware");
const { check } = require("express-validator");
const checkPermission = require("../../../middlewares/PermissionAuth");

// Add Ticket
router.post("/add", dbDBMiddleware, async (req, res) => {
  try {
    console.log("Ticket created successfully", req.body);
    const ticket = await req.raiseTicket.create(req.body);
    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error("Error saving ticket:", error);
    res.status(500).json({ message: "Failed to create ticket", error });
  }
});

// Get All Tickets
router.get(
  "/list",
  dbDBMiddleware,
  checkPermission("Raised Ticket", "read"),
  async (req, res) => {
    try {
      const tickets = await req.raiseTicket
        .find({ $or: [{ date: { $exists: false } }, { date: "" }] })
        .sort({ createdAt: -1 })
        .limit(5);

      res.status(200).json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tickets", error });
    }
  }
);

router.get("/viewAll", dbDBMiddleware, async (req, res) => {
  try {
    console.log(`issueData- issueData-issueData`);

    const tickets = await req.raiseTicket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets", error });
  }
});

// Resolve Ticket
router.put(
  "/resolve/:id",
  checkPermission("Raised Ticket", "create"),
  dbDBMiddleware,
  async (req, res) => {
    try {
      const updated = await req.raiseTicket.findByIdAndUpdate(
        req.params.id,
        {
          resolution: req.body.resolution,
          status: "Resolved",
          date: new Date(),
        },
        { new: true }
      );
      if (!updated)
        return res.status(404).json({ message: "Ticket not found" });
      res.status(200).json({ message: "Ticket resolved", updated });
    } catch (error) {
      res.status(500).json({ message: "Error resolving ticket", error });
    }
  }
);

module.exports = router;
