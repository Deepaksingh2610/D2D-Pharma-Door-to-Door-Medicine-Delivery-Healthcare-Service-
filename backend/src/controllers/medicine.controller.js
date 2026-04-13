import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../models/medicine.model.js";

// POST /api/medicines
export const addMedicine = asyncHandler(async (req, res) => {
  const { 
    storeEmail, storeName, name, price, mrp, category, description, 
    manufacturer, companyName, stock, unit, image, imageURL, 
    expiryDate, discount, gst, requiresPrescription 
  } = req.body;
  
  if (!storeEmail || !name || !price) throw new ApiError(400, "storeEmail, name, and price are required");

  const medicine = await Medicine.create({
    storeEmail, storeName, name,
    price: Number(price),
    mrp: mrp ? Number(mrp) : undefined,
    category, description, 
    manufacturer: manufacturer || companyName,
    companyName: companyName || manufacturer,
    stock: stock !== undefined ? Number(stock) : 100,
    unit: unit || "Strip",
    image,
    imageURL,
    expiryDate,
    discount: discount ? Number(discount) : 0,
    gst: gst ? Number(gst) : 0,
    requiresPrescription: !!requiresPrescription,
    isAvailable: true,
  });

  return res.status(201).json(new ApiResponse(201, medicine, "Medicine added"));
});

// GET /api/medicines/store/:email
export const getMedicinesByStore = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const meds = await Medicine.find({ storeEmail: email }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, meds, "Medicines by store"));
});

// GET /api/medicines/all
export const getAllMedicines = asyncHandler(async (req, res) => {
  const meds = await Medicine.find({ isAvailable: true }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, meds, "All medicines fetched"));
});

// DELETE /api/medicines/:id
export const deleteMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Medicine.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "Medicine deleted"));
});

// PATCH /api/medicines/:id
export const updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const med = await Medicine.findByIdAndUpdate(id, req.body, { new: true });
  if (!med) throw new ApiError(404, "Medicine not found");
  return res.status(200).json(new ApiResponse(200, med, "Medicine updated"));
});
// POST /api/medicines/bulk
export const bulkAddMedicines = asyncHandler(async (req, res) => {
  const { storeEmail, storeName, medicines } = req.body;
  if (!storeEmail || !Array.isArray(medicines) || medicines.length === 0) {
    throw new ApiError(400, "storeEmail and a non-empty medicines array are required");
  }

  const normalized = medicines.map(m => ({
    ...m,
    storeEmail,
    storeName,
    price: Number(m.price || 0),
    mrp: m.mrp ? Number(m.mrp) : undefined,
    stock: m.stock !== undefined ? Number(m.stock) : 100,
    discount: m.discount ? Number(m.discount) : 0,
    gst: m.gst ? Number(m.gst) : 0,
    companyName: m.companyName || m.manufacturer || m.brand,
    isAvailable: true,
  }));

  const inserted = await Medicine.insertMany(normalized);
  return res.status(201).json(new ApiResponse(201, inserted, `${inserted.length} medicines added successfully`));
});
