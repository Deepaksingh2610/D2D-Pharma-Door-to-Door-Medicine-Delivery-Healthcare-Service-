import mongoose, { Schema } from "mongoose";

const callbackSchema = new Schema(
  {
    phone: { type: String, required: true },
    email: { type: String, default: "anonymous" },
    status: { type: String, enum: ["pending", "called"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const Callback = mongoose.model("Callback", callbackSchema);
