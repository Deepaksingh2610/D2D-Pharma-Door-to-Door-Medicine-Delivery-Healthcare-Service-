import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Doctor } from "../models/doctor.model.js";
import { Pharmacy } from "../models/pharmacy.model.js";
import { Lab } from "../models/lab.model.js";
import { Notification } from "../models/notification.model.js";

// Helper: get model by role
const getModel = (role) => {
  if (role === "doctor") return Doctor;
  if (role === "pharmacy") return Pharmacy;
  if (role === "lab") return Lab;
  return null;
};

// GET /api/partners/role/:role  — approved partners list (main website pages)
export const getPartnersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const Model = getModel(role);
  if (!Model) throw new ApiError(400, "Invalid role");

  const partners = await Model.find({ approved: true })
    .select("-password")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, partners, `${role} list fetched`));
});

// GET /api/partners/all  — all partners (admin)
export const getAllPartners = asyncHandler(async (req, res) => {
  const [doctors, labs, pharmacies] = await Promise.all([
    Doctor.find().select("-password"),
    Lab.find().select("-password"),
    Pharmacy.find().select("-password"),
  ]);

  const all = [
    ...doctors.map((d) => ({ ...d.toObject(), role: "doctor" })),
    ...labs.map((l) => ({ ...l.toObject(), role: "lab" })),
    ...pharmacies.map((p) => ({ ...p.toObject(), role: "pharmacy" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json(new ApiResponse(200, all, "All partners fetched"));
});

// GET /api/partners/:role/:email  — single partner profile
export const getPartnerByEmail = asyncHandler(async (req, res) => {
  const { role, email } = req.params;
  const Model = getModel(role);
  if (!Model) throw new ApiError(400, "Invalid role");

  const partner = await Model.findOne({ email }).select("-password");
  if (!partner) throw new ApiError(404, "Partner not found");

  return res.status(200).json(new ApiResponse(200, partner, "Partner fetched"));
});

// PATCH /api/partners/:role/:email  — update partner profile
export const updatePartnerProfile = asyncHandler(async (req, res) => {
  const { role, email } = req.params;
  const Model = getModel(role);
  if (!Model) throw new ApiError(400, "Invalid role");

  // Never allow password/email change via this route
  const { password, email: _e, ...updates } = req.body;

  const partner = await Model.findOneAndUpdate({ email }, { $set: updates }, { new: true }).select("-password");
  if (!partner) throw new ApiError(404, "Partner not found");

  return res.status(200).json(new ApiResponse(200, partner, "Profile updated"));
});

// PATCH /api/partners/:role/:email/approve  — admin approve
export const approvePartner = asyncHandler(async (req, res) => {
  const { role, email } = req.params;
  const Model = getModel(role);
  if (!Model) throw new ApiError(400, "Invalid role");

  const partner = await Model.findOneAndUpdate(
    { email },
    { approved: true, rejected: false, approvedAt: new Date() },
    { new: true }
  ).select("-password");

  if (!partner) throw new ApiError(404, "Partner not found");

  // Notify the partner
  await Notification.create({
    targetEmail: email,
    patientEmail: email,
    type: "general",
    message: `🎉 Congratulations! Your ${role} account has been approved. You can now access your dashboard and start receiving bookings.`,
    read: false,
  });

  return res.status(200).json(new ApiResponse(200, partner, "Partner approved"));
});

// PATCH /api/partners/:role/:email/reject  — admin reject
export const rejectPartner = asyncHandler(async (req, res) => {
  const { role, email } = req.params;
  const Model = getModel(role);
  if (!Model) throw new ApiError(400, "Invalid role");

  const partner = await Model.findOneAndUpdate(
    { email },
    { approved: false, rejected: true, rejectedAt: new Date() },
    { new: true }
  ).select("-password");

  if (!partner) throw new ApiError(404, "Partner not found");

  await Notification.create({
    targetEmail: email,
    patientEmail: email,
    type: "general",
    message: `❌ Your ${role} account application has been reviewed and unfortunately rejected. Please contact support for more details.`,
    read: false,
  });

  return res.status(200).json(new ApiResponse(200, partner, "Partner rejected"));
});
