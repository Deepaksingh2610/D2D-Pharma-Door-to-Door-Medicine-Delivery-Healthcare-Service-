import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    // Patient info
    patientEmail: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    dob: { type: String },
    reason: { type: String },

    // Partner info
    partnerEmail: { type: String, required: true },
    partnerRole: { type: String, enum: ["doctor", "lab", "pharmacy"], required: true },
    partnerName: { type: String },

    // Appointment scheduling
    appointmentDate: { type: String },
    appointmentTime: { type: String },
    consultationType: { type: String, default: "physical" }, // physical | video

    // Payment
    fees: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, default: "pending" }, // pending | paid
    paymentMethod: { type: String }, // card | upi | netbanking | cod

    // Status
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },

    // Pharmacy order specific
    storeName: { type: String },
    labName: { type: String },
    dispatched: { type: Boolean, default: false },
    dispatchedAt: { type: Date },

    // Lab specific
    sampleCollected: { type: Boolean, default: false },
    sampleCollectedAt: { type: Date },
    reportUploaded: { type: Boolean, default: false },
    reportUploadedAt: { type: Date },
    homeCollectionCharge: { type: Number, default: 0 },
    isPackage: { type: Boolean, default: false },
    isCenterVisit: { type: Boolean, default: false },
    selectedTests: [{
      id: String,
      name: String,
      qty: Number,
      price: Number
    }],

    // Token and Slot
    tokenNumber: { type: String },
    slotTime: { type: String },

    // Video Call info
    meetingLink: { type: String },
    meetingActive: { type: Boolean, default: false },

    // Prescription
    prescriptionText: { type: String },
    prescriptionImage: { type: String },

    bookedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
