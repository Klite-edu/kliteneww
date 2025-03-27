const mongoose = require("mongoose");

const formBuilderSchema = new mongoose.Schema({
    fields: [{
        label: { type: String, required: true }, // Field label
        type: { type: String, required: true }, // Input type (text, number, etc.)
        options: { type: [String], default: [] }, // Options for dropdown/select fields
        required: { type: Boolean, default: false }, // Required field flag
    }],
    client: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clients',
        required: true
    }],
    buttons: {
        BackgroundColor: { type: String, required: true },
        color: { type: String, required: true },
        borderColor: { type: String },
        borderRadius: { type: String },
        borderWidth: { type: String },
        padding: { type: String },
        margin: { type: String },
        redirectLink: { type: String, required: true },
        text: { type: String, required: true }
    },
    formInfo: {
        title: { type: String, required: true, default: "Enquiry Form" },
        color: { type: String, required: true, default: '#2DAA9E' },
        bgColor: { type: String, required: true, default: '#000000' }
    },
    policyInfo: {
        title: { type: String },
        policyRedirectLink: { type: String },
        visibility: { type: Boolean, default: false }
    }
})

const FormBuilder = mongoose.model('formBuilder', formBuilderSchema);
module.exports = FormBuilder;