import mongoose, { Schema } from "mongoose";

const doctorAvailabilitySchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
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
      end: { type: String, default: "12:00" },
      active: { type: Boolean, default: true },
    },
    evening: {
      start: { type: String, default: "17:00" },
      end: { type: String, default: "20:00" },
      active: { type: Boolean, default: true },
    },
    consultationTypes: {
      type: [String],
      enum: ["video", "physical"],
      default: ["physical"],
    },
    slotDuration: {
      type: Number,
      enum: [15, 30, 60],
      default: 30,
    },
    capacityPerSlot: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

export const DoctorAvailability = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
