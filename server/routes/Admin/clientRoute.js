const express = require("express");
const router = express.Router();
const Client = require("../../models/Admin/client-modal");
const ClientPlan = require("../../models/clients/clientplan");
const Subscription = require("../../models/Admin/Subscription");
const UserSubscription = require("../../models/Admin/userSubscription");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { verifyToken } = require("../../middlewares/auth");

router.post("/register", async (req, res) => {
  try {
    console.log("Register request received with body:", req.body);

    const {
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industryType,
      selectedPlan,
      selectedPlanId,
      password,
    } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new client
    const newClient = new Client({
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industryType,
      selectedPlan,
      selectedPlanId,
      password: hashedPassword, 
    });

    const savedClient = await newClient.save();
    

    // Fetch the selected plan details from the Subscription model
    const planDetails = await Subscription.findById(selectedPlanId);
    

    if (!planDetails) {
      console.log("Invalid subscription plan.");
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    // Calculate subscription end date
    let endDate;
    const currentDate = new Date();
   
    const duration = planDetails.duration.toLowerCase();
    if (duration === "yearly") {
      endDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
    } else if (duration === "monthly") {
      endDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    } else if (duration === "7 days") {
      endDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
    } else {
      const durationMatch = duration.match(/^(\d+)\s*days?$/i);
      if (durationMatch) {
        const daysToAdd = parseInt(durationMatch[1], 10);
        endDate = new Date(currentDate.setDate(currentDate.getDate() + daysToAdd));
      } else {
        console.log("Invalid subscription duration.");
        return res.status(400).json({ error: "Invalid subscription duration" });
      }
    }

    // Create and save user subscription
    const newSubscription = new UserSubscription({
      clientId: savedClient._id, 
      planId: selectedPlanId,   
      endDate: endDate,        
      status: "active",
    });

    const savedSubscription = await newSubscription.save();

    // Fetch the subscription details again for `ClientPlan`
    const userSub = await UserSubscription.findOne({ clientId: savedClient._id }).populate("planId");
    if (!userSub || !userSub.planId) {
      return res.status(400).json({ error: "User subscription not found" });
    }

    // Create and save ClientPlan entry
    const clientPlanData = new ClientPlan({
      email: savedClient.email,
      selectedPlanID: userSub.planId._id,
      selectedPlan: {
        id: userSub.planId._id,
        name: userSub.planId.name,
        price: userSub.planId.price,
        duration: userSub.planId.duration,
        status: userSub.status,
      },
    });

    await clientPlanData.save();

    // Respond with success
    res.status(201).json({ 
      message: "User added successfully", 
      client: savedClient, 
      subscription: savedSubscription, 
      clientPlan: clientPlanData 
    });

  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Error adding user", details: error.message });
  }
});



router.get("/total-clients", async (req, res) => {
  try {
    // Count all clients (active and inactive)
    const totalClients = await Client.countDocuments();

    // Count active clients specifically
    const activeClients = await Client.countDocuments({ status: "Active" });

    res.status(200).json({ totalClients, activeClients });
  } catch (error) {
    console.error("Error fetching total clients:", error);
    res.status(500).json({ message: "Failed to fetch total clients" });
  }
});

router.get("/monthlyrevenue", async (req, res) => {
  try {
    // Log the request for monthly revenue

    // Fetch all clients
    const clients = await Client.find({});

    // Initialize the revenue data object
    let revenueData = {};

    // Loop through clients to calculate revenue grouped by month
    for (const client of clients) {

      // Example: Using client's createdAt to determine the month
      const month = new Date(client.createdAt).toLocaleString("default", { month: "short", year: "numeric" });
      const subscription = await Subscription.model("Subscription").findById(client.selectedPlanId);

      // Ensure the subscription exists and price is available
      const price = subscription && subscription.price ? parseFloat(subscription.price) : 0;

      if (price > 0) {
        // Add the price to the respective month
        if (!revenueData[month]) {
          revenueData[month] = 0;
        }
        revenueData[month] += price;
      } else {
        console.log(`Skipping client ${client.fullName} as the price is 0 or invalid.`);
      }
    }

    // Send the revenue data as the response
    res.json({ revenueData });

  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ error: "Error fetching monthly revenue" });
  }
});


router.get("/clientData", async (req, res) => {
  try {
    const clients = await Client.find();
    console.log("clients", clients);

    res.status(200).json(clients);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching clients", details: error.message });
  }
});

router.get("/mostPurchasedPlans", async (req, res) => {
  try {
    // Fetch all subscriptions
    const subscriptions = await UserSubscription.aggregate([
      {
        $group: {
          _id: "$planId", // Group by planId
          count: { $sum: 1 } // Count the number of subscriptions for each plan
        }
      },
      {
        $lookup: {
          from: "subscriptions", // Assuming the Subscription model is named 'subscriptions'
          localField: "_id",
          foreignField: "_id",
          as: "planDetails"
        }
      },
      {
        $unwind: "$planDetails" // Unwind the array to get each plan's details
      },
      {
        $project: {
          name: "$planDetails.name", // Plan name
          value: "$count", // The count of how many times it was purchased
          color: { // Choose a color based on the plan
            $switch: {
              branches: [
                { case: { $eq: ["$planDetails.name", "Basic"] }, then: "#4CAF50" },
                { case: { $eq: ["$planDetails.name", "Standard"] }, then: "#FFC107" },
                { case: { $eq: ["$planDetails.name", "Premium"] }, then: "#F44336" }
              ],
              default: "#8884d8" // Default color
            }
          }
        }
      }
    ]);

    // Send the response with the most purchased plans
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching most purchased plans:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/transactionData", async (req, res) => {
  try {
    // Fetch all clients, including plan details
    const clients = await Client.find()
      .populate("selectedPlanId", "name price")  // Populate with plan details (name and price)
      .exec();

    // Map client data to match the required transaction format
    const transactions = clients.map((client, index) => {
      return {
        id: (index + 1).toString(), // Assuming an id can be generated from the index
        name: client.fullName,
        date: new Date(client.createdAt).toISOString().split("T")[0], // Format the date
        plan: client.selectedPlanId.name, // Plan name from the Subscription model
        price: client.selectedPlanId.price // Plan price from the Subscription model
      };
    });

    console.log("Transactions:", transactions);
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Error fetching transaction data", details: error.message });
  }
});


router.get("/clientsubscriptions", async (req, res) => {
  try {
    // Fetch all clients
    const clients = await Client.find().lean();

    if (!clients || clients.length === 0) {
      console.warn("⚠️ No clients found!");
      return res.status(404).json({ error: "No clients found" });
    }

    // Fetch subscriptions for all clients
    const clientIds = clients.map(client => client._id);
    const subscriptions = await UserSubscription.find({ clientId: { $in: clientIds } }).lean();

    // Create a map for quick lookup of subscriptions by clientId
    const subscriptionMap = new Map();
    subscriptions.forEach(sub => {
      subscriptionMap.set(sub.clientId.toString(), sub);
    });

    // Fetch subscription prices based on selectedPlanID
    const planIds = clients.map(client => client.selectedPlanId
    ).filter(id => id); // Remove undefined/null IDs
    const plans = await Subscription.find({ _id: { $in: planIds } }).lean();
    // Create a map for quick lookup of plan prices by plan ID
    const planPriceMap = new Map();
    plans.forEach(plan => {
      planPriceMap.set(plan._id.toString(), plan.price);
    });

    // Merge clients with their subscriptions and prices
    const clientsWithSubscriptions = clients.map(client => {
      const subscription = subscriptionMap.get(client._id.toString()) || { status: "No Subscription", startDate: null, endDate: null };
      const planPrice = planPriceMap.get(client.selectedPlanId?.toString()) || "N/A"; // Default price if no plan found

      return {
        ...client,
        subscription,
        planPrice, // Attach price from SubscriptionPlan model
      };
    });
    res.json(clientsWithSubscriptions);
  } catch (error) {
    console.error("❌ Error fetching clients, subscriptions, and prices:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a single client by ID
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json(client);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching client", details: error.message });
  }
});

// Update a client by ID
router.put("/update/:id", async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    res
      .status(200)
      .json({ message: "Client updated successfully", client: updatedClient });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating client", details: error.message });
  }
});

// Delete a client by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting client", details: error.message });
  }
});

module.exports = router;
