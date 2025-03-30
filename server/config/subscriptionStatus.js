const cron = require("node-cron");
const UserSubscription = require("../models/Admin/userSubscription");

// Schedule job to run every midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const currentDate = new Date();
    
    // Find all active subscriptions that are expired
    const expiredSubscriptions = await UserSubscription.find({
      status: "active",
      endDate: { $lt: currentDate },
    });

    if (expiredSubscriptions.length > 0) {
      // Update all found subscriptions to "expired"
      await UserSubscription.updateMany(
        { _id: { $in: expiredSubscriptions.map(sub => sub._id) } },
        { $set: { status: "expired" } }
      );

      console.log(`✅ ${expiredSubscriptions.length} subscriptions expired.`);
    }
  } catch (error) {
    console.error("❌ Error updating subscriptions:", error.message);
  }
});

module.exports = cron;
