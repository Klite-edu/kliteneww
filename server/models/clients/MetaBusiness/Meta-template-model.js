const mongoose = require('mongoose');

const MetaTemplateSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  name: String,
  language: String,
  status: String,
  category: String,
  components: Array,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MetaTemplate', MetaTemplateSchema);
