import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";

// GET /api/notifications/:email
export const getNotifications = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const notifs = await Notification.find({ targetEmail: email }).sort({ createdAt: -1 }).limit(100);
  return res.status(200).json(new ApiResponse(200, notifs, "Notifications fetched"));
});

// POST /api/notifications
export const createNotification = asyncHandler(async (req, res) => {
  const { targetEmail, message, type, patientEmail, appointmentId, reportId } = req.body;
  if (!targetEmail || !message) throw new ApiError(400, "targetEmail and message required");

  const notif = await Notification.create({
    targetEmail, message,
    type: type || "general",
    patientEmail: patientEmail || targetEmail,
    appointmentId, reportId,
    read: false,
  });

  return res.status(201).json(new ApiResponse(201, notif, "Notification created"));
});

// PATCH /api/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notif = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  if (!notif) throw new ApiError(404, "Notification not found");
  return res.status(200).json(new ApiResponse(200, notif, "Marked as read"));
});

// PATCH /api/notifications/readall/:email
export const markAllRead = asyncHandler(async (req, res) => {
  const { email } = req.params;
  await Notification.updateMany({ targetEmail: email, read: false }, { read: true });
  return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});
