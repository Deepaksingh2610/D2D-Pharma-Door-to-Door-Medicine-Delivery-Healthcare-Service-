import mongoose, { Schema } from "mongoose";

const medicineSchema = new Schema(
  {
    storeEmail: { type: String, required: true },
    storeName: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number },
    category: { type: String },
    description: { type: String },
    manufacturer: { type: String },
    stock: { type: Number, default: 100 },
    unit: { type: String, default: "Strip" },
    image: { type: String }, // URL or base64
    imageURL: { type: String }, // Optional direct URL
    companyName: { type: String },
    expiryDate: { type: String },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    requiresPrescription: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);
