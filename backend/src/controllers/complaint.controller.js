import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Complaint } from "../models/complaint.model.js";
import { Notification } from "../models/notification.model.js";

// POST /api/complaints
export const submitComplaint = asyncHandler(async (req, res) => {
  const { name, email, userType, reason } = req.body;
  if (!email || !reason) throw new ApiError(400, "email and reason are required");

  const complaint = await Complaint.create({ name, email, userType, reason, status: "pending" });
  return res.status(201).json(new ApiResponse(201, complaint, "Complaint submitted"));
});

// GET /api/complaints/all  (admin)
export const getAllComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, complaints, "All complaints"));
});

// PATCH /api/complaints/:id  (admin update/reply)
export const updateComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminReply } = req.body;

  const original = await Complaint.findById(id);
  if (!original) throw new ApiError(404, "Complaint not found");

  const updated = await Complaint.findByIdAndUpdate(id, { status, adminReply }, { new: true });

  // Notify original user
  if (adminReply || status === "read") {
    await Notification.create({
      targetEmail: original.email,
      patientEmail: original.email,
      type: "complaint_update",
      message: adminReply || "Your support ticket has been read. Action will be taken shortly.",
      read: false,
    });
  }

  return res.status(200).json(new ApiResponse(200, updated, "Complaint updated"));
});
