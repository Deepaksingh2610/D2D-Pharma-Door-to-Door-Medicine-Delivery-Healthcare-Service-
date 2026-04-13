import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { LabTest } from "../models/labtest.model.js";

// POST /api/labtests
export const addLabTest = asyncHandler(async (req, res) => {
  const { 
    labEmail, labName, name, price, description, turnaround, 
    preparation, sampleType, category, homeCollection,
    homeCollectionCharge, isPackage, packageTests 
  } = req.body;
  if (!labEmail || !name || !price) throw new ApiError(400, "labEmail, name, and price are required");

  const test = await LabTest.create({
    labEmail, labName, name,
    price: Number(price),
    description, turnaround, preparation, sampleType, category,
    homeCollection: homeCollection !== undefined ? !!homeCollection : true,
    homeCollectionCharge: Number(homeCollectionCharge || 0),
    isPackage: !!isPackage,
    packageTests: Array.isArray(packageTests) ? packageTests : [],
    isAvailable: true,
  });

  return res.status(201).json(new ApiResponse(201, test, "Lab test added"));
});

// GET /api/labtests/lab/:email
export const getLabTestsByLab = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const tests = await LabTest.find({ labEmail: email }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, tests, "Lab tests by lab"));
});

// GET /api/labtests/all
export const getAllLabTests = asyncHandler(async (req, res) => {
  const tests = await LabTest.find({ isAvailable: true }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, tests, "All lab tests fetched"));
});

// DELETE /api/labtests/:id
export const deleteLabTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await LabTest.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "Lab test deleted"));
});

// PATCH /api/labtests/:id
export const updateLabTest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const test = await LabTest.findByIdAndUpdate(id, req.body, { new: true });
  if (!test) throw new ApiError(404, "Lab test not found");
  return res.status(200).json(new ApiResponse(200, test, "Lab test updated"));
});

// POST /api/labtests/bulk
export const bulkAddLabTests = asyncHandler(async (req, res) => {
  const { labEmail, labName, tests } = req.body;
  if (!labEmail || !Array.isArray(tests)) throw new ApiError(400, "labEmail and tests array are required");

  const formattedTests = tests.map(t => ({
    ...t,
    labEmail,
    labName,
    price: Number(t.price || 0),
    homeCollectionCharge: Number(t.homeCollectionCharge || 0),
    isAvailable: true
  }));

  const createdTests = await LabTest.insertMany(formattedTests);
  return res.status(201).json(new ApiResponse(201, createdTests, "Bulk tests added successfully"));
});
