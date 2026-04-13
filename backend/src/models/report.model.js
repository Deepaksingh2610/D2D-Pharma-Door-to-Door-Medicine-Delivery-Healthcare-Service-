import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
  {
    appointmentId: { type: String, required: true },
    patientEmail: { type: String, required: true },
    labEmail: { type: String },
    labName: { type: String },
    testName: { type: String },
    fileName: { type: String },
    fileData: { type: String }, // base64 encoded PDF
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
