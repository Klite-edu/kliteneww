const express = require("express");
const Ticket = require("../../../models/clients/TicketRaise/TicketRaise-model");
const router = express.Router();

// Add Ticket
router.post("/add", async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error("Error saving ticket:", error);
    res.status(500).json({ message: "Failed to create ticket", error });
  }
});

// Get All Tickets
router.get("/list", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets", error });
  }
});

// Resolve Ticket
router.put("/resolve/:id", async (req, res) => {
  try {
    const updated = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        resolution: req.body.resolution, 
        status: "Resolved",
        resolvedAt: new Date() 
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Ticket resolved", updated });
  } catch (error) {
    res.status(500).json({ message: "Error resolving ticket", error });
  }
});

module.exports = router;
