import mongoose, { Schema } from "mongoose";

const slotSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
    },
    labId: {
      type: Schema.Types.ObjectId,
      ref: "Lab",
    },
    partnerEmail: { type: String }, // For convenience

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    slotTime: {
      type: String, // e.g., "09:00 - 09:30"
      required: true,
    },
    type: {
      type: String,
      enum: ["morning", "evening"],
      required: true,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Index to quickly find slots by partner (doctor or lab)
slotSchema.index({ partnerEmail: 1, date: 1, slotTime: 1 }, { unique: true });

export const Slot = mongoose.model("Slot", slotSchema);
