const mongoose = require("mongoose");
const CompanySchema = new mongoose.Schema({
  company: String,
  opportunities: {
    total: Number,
    leads: {
      cold: Number,
      warm: Number,
      hot: Number,
    },
    progress: Number,
  },
  sales: {
    total_revenue: Number,
    monthly_sales: [{ month: String, revenue: Number }],
    sales_growth_percentage: Number,
  },
});

module.exports = mongoose.model("Company", CompanySchema);
