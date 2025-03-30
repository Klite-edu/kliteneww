const express = require("express");
const Subscription = require("../../models/Admin/Subscription");

const router = express.Router();

// 🔹 Get all subscription plans
router.get("/subscription", async (req, res) => {
    try {
        const plans = await Subscription.find();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Get a single subscription plan by ID
router.get("/:id", async (req, res) => {
    try {
        const plan = await Subscription.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: "Subscription plan not found" });

        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Create a new subscription plan
router.post("/", async (req, res) => {
    try {
        const { name, price, duration, features } = req.body;

        const newPlan = new Subscription({
            name,
            price,
            duration,
            features,
        });

        await newPlan.save();
        res.status(201).json({ message: "Subscription plan created", plan: newPlan });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Update a subscription plan
router.put("/:id", async (req, res) => {
    try {
        const updatedPlan = await Subscription.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedPlan) return res.status(404).json({ message: "Subscription plan not found" });

        res.json({ message: "Subscription plan updated", plan: updatedPlan });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// 🔹 Delete a subscription plan
router.delete("/:id", async (req, res) => {
    try {
        const deletedPlan = await Subscription.findByIdAndDelete(req.params.id);
        if (!deletedPlan) return res.status(404).json({ message: "Subscription plan not found" });

        res.json({ message: "Subscription plan deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
