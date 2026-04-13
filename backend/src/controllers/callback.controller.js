import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Callback } from "../models/callback.model.js";

// POST /api/callbacks
export const addCallbackRequest = asyncHandler(async (req, res) => {
  const { phone, email } = req.body;
  if (!phone) throw new ApiError(400, "Phone is required");

  const callback = await Callback.create({ phone, email, status: "pending" });
  return res.status(201).json(new ApiResponse(201, callback, "Callback request submitted"));
});

// GET /api/callbacks/all
export const getAllCallbacks = asyncHandler(async (req, res) => {
  const callbacks = await Callback.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, callbacks, "All callbacks"));
});

// PATCH /api/callbacks/:id
export const updateCallbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updated = await Callback.findByIdAndUpdate(
    id,
    { status, notifiedAt: status === 'called' ? new Date() : undefined },
    { new: true }
  );
  if (!updated) throw new ApiError(404, "Callback not found");

  return res.status(200).json(new ApiResponse(200, updated, "Callback status updated"));
});
