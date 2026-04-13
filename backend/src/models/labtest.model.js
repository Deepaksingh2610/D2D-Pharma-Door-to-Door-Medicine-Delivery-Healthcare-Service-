import mongoose, { Schema } from "mongoose";

const labTestSchema = new Schema(
  {
    labEmail: { type: String, required: true },
    labName: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    turnaround: { type: String }, // e.g. "24 hours"
    preparation: { type: String }, // e.g. "8 hour fasting required"
    sampleType: { type: String }, // blood, urine, etc.
    category: { type: String },
    isAvailable: { type: Boolean, default: true },
    homeCollection: { type: Boolean, default: true },
    homeCollectionCharge: { type: Number, default: 0 },
    isPackage: { type: Boolean, default: false },
    packageTests: [{ type: String }], // Array of test names or IDs included in the package
    requiresCenterVisit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LabTest = mongoose.model("LabTest", labTestSchema);
