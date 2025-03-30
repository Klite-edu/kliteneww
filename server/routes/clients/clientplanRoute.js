const express = require("express");
const ClientPlan = require("../../models/clients/clientplan");
const userSubscription = require("../../models/Admin/userSubscription");
const router = express.Router();


router.get("/clientData/:email", async (req, res) => {
    try {
        const { email } = req.params;

        // Find the client based on email and populate the subscription details
        const client = await ClientPlan.findOne({ email }).populate({
            path: "selectedPlanID",
            model: userSubscription, // Explicitly reference the correct model
        });


        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.json({
            name: client.selectedPlan.name,
            email: client.email,
            subscriptionPlan: client.selectedPlan,
            subscriptionStatus: client.selectedPlan?.status || "expired", // Ensure correct status
            subscriptionId: client.selectedPlanID?._id || null, // Subscription ID if available
        });
    } catch (error) {
        console.error("Error fetching clientplan data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
