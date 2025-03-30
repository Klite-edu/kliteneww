const express = require("express");
const router = express.Router();
const UserSubscription = require("../../models/Admin/userSubscription");
const Subscription = require("../../models/Admin/Subscription");

// 🔹 Get all user subscriptions
router.post("/renew", async (req, res) => {
    try {
        const { clientId, planId } = req.body;

        // Find the expired subscription for the client
        const subscription = await UserSubscription.findOne({
            clientId,
            planId,
            status: "expired",
        });

        if (!subscription) {
            return res.status(404).json({ error: "No expired subscription found" });
        }

        // Get plan details to extend the end date
        const plan = await Subscription.findById(planId);
        if (!plan) {
            return res.status(400).json({ error: "Invalid plan ID" });
        }

        // Calculate new end date
        const newEndDate = new Date();
        if (plan.duration === "yearly") {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else if (plan.duration === "monthly") {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else {
            return res.status(400).json({ error: "Invalid plan duration" });
        }

        // Update subscription status and end date
        subscription.status = "renewed";
        subscription.endDate = newEndDate;
        await subscription.save();

        res.status(200).json({ message: "Subscription renewed successfully", subscription });
    } catch (error) {
        res.status(500).json({ error: "Error renewing subscription", details: error.message });
    }
});




router.get("/", async (req, res) => {
    try {
        const subscriptions = await UserSubscription.find().populate("userId", "name email").populate("planId");
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Get a single user subscription
router.get("/:id", async (req, res) => {
    try {
        const subscription = await UserSubscription.findById(req.params.id).populate("userId", "name email").populate("planId");
        if (!subscription) return res.status(404).json({ message: "Subscription not found" });

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Create a new user subscription
router.post("/", async (req, res) => {
    try {
        const { userId, planId, endDate } = req.body;

        const newSubscription = new UserSubscription({ userId, planId, endDate });
        await newSubscription.save();

        res.status(201).json({ message: "User subscription created", subscription: newSubscription });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Delete a user subscription
router.delete("/:id", async (req, res) => {
    try {
        const deletedSubscription = await UserSubscription.findByIdAndDelete(req.params.id);
        if (!deletedSubscription) return res.status(404).json({ message: "Subscription not found" });

        res.json({ message: "Subscription deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
