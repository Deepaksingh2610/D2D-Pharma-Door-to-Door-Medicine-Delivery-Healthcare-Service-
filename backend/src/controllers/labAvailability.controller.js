import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { LabAvailability } from "../models/labAvailability.model.js";
import { Lab } from "../models/lab.model.js";

// GET /api/lab-availability/me
export const getMyLabAvailability = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new ApiError(400, "Email is required");
  const normalizedEmail = email.toLowerCase();

  let availability = await LabAvailability.findOne({ labEmail: normalizedEmail });
  if (!availability) {
    const lab = await Lab.findOne({ email: normalizedEmail });
    if (!lab) throw new ApiError(404, "Lab not found");
    
    // Create default availability
    availability = await LabAvailability.create({
      labId: lab._id,
      labEmail: email,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      morning: { start: "09:00", end: "13:00", active: true },
      evening: { start: "16:00", end: "20:00", active: true },
      slotDuration: 30,
      capacityPerSlot: 3
    });
  }

  return res.status(200).json(new ApiResponse(200, availability, "Lab availability fetched"));
});

// POST /api/lab-availability/save
export const saveLabAvailability = asyncHandler(async (req, res) => {
  const { labEmail, availableDays, morning, evening, slotDuration, capacityPerSlot } = req.body;
  if (!labEmail) throw new ApiError(400, "labEmail is required");
  const normalizedEmail = labEmail.toLowerCase();

  const lab = await Lab.findOne({ email: normalizedEmail });
  if (!lab) throw new ApiError(404, "Lab not found");

  const availability = await LabAvailability.findOneAndUpdate(
    { labEmail: normalizedEmail },
    {
      labId: lab._id,
      labEmail: normalizedEmail,
      availableDays,
      morning,
      evening,
      slotDuration,
      capacityPerSlot
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(new ApiResponse(200, availability, "Lab availability saved"));
});
