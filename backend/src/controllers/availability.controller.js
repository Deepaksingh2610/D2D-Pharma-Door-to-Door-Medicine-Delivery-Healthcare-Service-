import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DoctorAvailability } from "../models/doctorAvailability.model.js";
import { Doctor } from "../models/doctor.model.js";

// POST/PUT /api/doctor/availability
export const upsertAvailability = asyncHandler(async (req, res) => {
  const { doctorId, availableDays, morning, evening, consultationTypes, slotDuration, capacityPerSlot } = req.body;

  if (!doctorId) {
    throw new ApiError(400, "Doctor ID is required");
  }

  // Ensure doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  const availability = await DoctorAvailability.findOneAndUpdate(
    { doctorId },
    {
      $set: {
        availableDays,
        morning,
        evening,
        consultationTypes,
        slotDuration,
        capacityPerSlot,
      },
    },
    { new: true, upsert: true }
  );

  return res.status(200).json(new ApiResponse(200, availability, "Availability updated successfully"));
});

// GET /api/doctor/availability/:doctorId
export const getDoctorAvailability = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const availability = await DoctorAvailability.findOne({ doctorId });
  if (!availability) {
    // Return default availability or empty
    return res.status(200).json(new ApiResponse(200, {}, "No availability set for this doctor"));
  }

  return res.status(200).json(new ApiResponse(200, availability, "Availability fetched successfully"));
});
