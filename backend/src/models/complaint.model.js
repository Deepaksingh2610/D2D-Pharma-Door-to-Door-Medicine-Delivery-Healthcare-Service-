import mongoose, { Schema } from "mongoose";

const complaintSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    userType: { type: String }, // Doctor | Lab | Pharmacy | User
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "read", "resolved"], default: "pending" },
    adminReply: { type: String },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model("Complaint", complaintSchema);
