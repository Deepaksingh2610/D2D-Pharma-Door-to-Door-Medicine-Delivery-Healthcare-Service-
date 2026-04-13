import mongoose, { Schema } from "mongoose";

const labAvailabilitySchema = new Schema(
  {
    labId: {
      type: Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
      unique: true,
    },
    labEmail: {
      type: String,
      required: true,
      unique: true,
    },
    availableDays: {
      type: [String],
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    morning: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "13:00" },
      active: { type: Boolean, default: true },
    },
    evening: {
      start: { type: String, default: "16:00" },
      end: { type: String, default: "20:00" },
      active: { type: Boolean, default: true },
    },
    slotDuration: {
      type: Number,
      enum: [15, 30, 60],
      default: 30,
    },
    capacityPerSlot: {
      type: Number,
      default: 3, // Lower default for labs as they handle complex equipment
    },
  },
  { timestamps: true }
);

export const LabAvailability = mongoose.model("LabAvailability", labAvailabilitySchema);
