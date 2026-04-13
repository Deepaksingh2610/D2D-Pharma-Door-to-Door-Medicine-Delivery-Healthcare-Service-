import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
    medicineId: {
        type: Schema.Types.ObjectId,
        ref: "Medicine",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    storeEmail: {
        type: String,
        required: true
    }
});

const orderSchema = new Schema(
    {
        patientEmail: {
            type: String,
            required: true,
            index: true
        },
        customerName: {
            type: String,
            required: true
        },
        customerPhone: {
            type: String,
            required: true
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            required: true
        },
        deliveryAddress: {
            type: String,
            required: true
        },
        paymentMethod: {
            type: String,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },
        status: {
            type: String,
            enum: ["placed", "confirmed", "dispatched", "out_for_delivery", "delivered", "cancelled"],
            default: "placed"
        },
        prescriptionUrl: {
            type: String // Base64 string or URL
        },
        // Tracking Coordinates
        // Tracking & Pricing
        deliveryLat: { type: Number },
        deliveryLng: { type: Number },
        pickupLat:   { type: Number }, // Store Lat
        pickupLng:   { type: Number }, // Store Lng
        distance:    { type: Number }, // In KM
        deliveryCharge: { type: Number },
        riderEarning:   { type: Number },
        medicineTotal:  { type: Number },

        // Rider Tracking
        riderEmail: { type: String },
        riderName: { type: String },
        riderPhone: { type: String },
        deliveryOTP: { type: String },
        
        // Pharmacy Details
        storeEmail: {
            type: String,
            required: true,
            index: true
        },
        storeName: {
            type: String
        }
    },
    { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
