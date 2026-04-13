import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    targetEmail: { type: String, required: true },
    patientEmail: { type: String },
    appointmentId: { type: String },
    type: {
      type: String,
      enum: [
        "new_appointment",
        "appointment_accepted",
        "appointment_rejected",
        "appointment_reminder",
        "order",
        "new_order",
        "order_accepted",
        "order_dispatched",
        "order_status",
        "sample_collected",
        "report_ready",
        "report",
        "booking",
        "complaint_update",
        "general",
      ],
      default: "general",
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    reportId: { type: String },
  },
  { timestamps: true }
);

// Index for fast per-user queries
notificationSchema.index({ targetEmail: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
