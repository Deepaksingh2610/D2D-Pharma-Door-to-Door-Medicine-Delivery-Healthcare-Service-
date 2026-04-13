import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Notification } from "../models/notification.model.js";

// Helper: push a notification to DB
const pushNotification = async (data) => {
  try {
    await Notification.create({
      targetEmail: data.targetEmail,
      patientEmail: data.patientEmail || data.targetEmail,
      type: data.type || "general",
      message: data.message,
      read: false,
    });
  } catch (e) {
    console.error("Notification push failed:", e.message);
  }
};

// GET /api/riders/available
// Fetch all orders that have been confirmed by a pharmacy and are ready for pickup
export const getAvailableOrders = asyncHandler(async (req, res) => {
    // Both confirmed and dispatched orders can be picked up if dispatched is treated as "pharmacy has given it away"
    const orders = await Order.find({ 
        status: { $in: ["confirmed", "dispatched"] },
        riderEmail: { $exists: false } 
    }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "Available orders fetched"));
});

// GET /api/riders/my-deliveries/:email
export const getMyDeliveries = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const orders = await Order.find({ riderEmail: email }).sort({ updatedAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "Rider deliveries fetched"));
});

// PATCH /api/riders/:id/accept
export const acceptDelivery = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { riderEmail, riderName, riderPhone } = req.body;

    if (!riderEmail || !riderName || !riderPhone) {
        throw new ApiError(400, "Rider details are required");
    }

    // Generate a 4-digit numeric OTP
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

    // Find and update the order
    const order = await Order.findOneAndUpdate(
        { _id: id, status: { $in: ["confirmed", "dispatched"] }, riderEmail: { $exists: false } }, // Ensure no one else took it
        { 
            status: "out_for_delivery",
            riderEmail,
            riderName,
            riderPhone,
            deliveryOTP
        },
        { new: true }
    );

    if (!order) {
        throw new ApiError(400, "Order is no longer available or already claimed");
    }

    // Notify patient
    if (order.patientEmail) {
        await pushNotification({
            targetEmail: order.patientEmail,
            patientEmail: order.patientEmail,
            type: "order_dispatched",
            message: `🚴 Delivery Update: Your medicines from ${order.storeName} are out for delivery with ${riderName}. Check your profile for the verification OTP.`,
        });
    }

    // Notify store
    if (order.storeEmail) {
        await pushNotification({
            targetEmail: order.storeEmail,
            patientEmail: order.patientEmail,
            type: "order_status",
            message: `📦 Rider ${riderName} (${riderPhone}) has accepted the pickup for ${order.customerName || order.patientEmail}'s order.`,
        });
    }

    return res.status(200).json(new ApiResponse(200, order, "Delivery accepted successfully"));
});

// PATCH /api/riders/:id/deliver
export const completeDelivery = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { deliveryOTP } = req.body;

    if (!deliveryOTP) {
        throw new ApiError(400, "Delivery OTP is required");
    }

    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== "out_for_delivery") {
        throw new ApiError(400, "Order is not currently out for delivery");
    }

    if (order.deliveryOTP !== deliveryOTP) {
        throw new ApiError(400, "Invalid OTP provided");
    }

    // Update status to delivered
    order.status = "delivered";
    await order.save();

    // Notify patient
    if (order.patientEmail) {
        await pushNotification({
            targetEmail: order.patientEmail,
            patientEmail: order.patientEmail,
            type: "general",
            message: `✅ Delivered: Your medicines have been successfully delivered. Thank you for using D2D Pharma!`,
        });
    }

    return res.status(200).json(new ApiResponse(200, order, "Order marked as delivered"));
});

// GET /api/riders/earnings/:email
export const getRiderEarnings = asyncHandler(async (req, res) => {
    const { email } = req.params;
    if (!email) throw new ApiError(400, "Rider email is required");

    const orders = await Order.find({ riderEmail: email, status: "delivered" }).sort({ updatedAt: -1 });

    const totalEarnings = orders.reduce((sum, o) => sum + (Number(o.riderEarning) || 0), 0);
    const totalKM = orders.reduce((sum, o) => sum + (Number(o.distance) || 0), 0);
    const completedOrders = orders.length;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayEarnings = orders
        .filter(o => new Date(o.updatedAt) >= startOfDay)
        .reduce((sum, o) => sum + (Number(o.riderEarning) || 0), 0);

    const data = {
        totalEarnings,
        totalKM,
        completedOrders,
        todayEarnings,
        history: orders.slice(0, 10).map(o => ({
            id: o._id,
            date: o.updatedAt,
            amount: o.riderEarning,
            distance: o.distance,
            storeName: o.storeName
        }))
    };

    return res.status(200).json(new ApiResponse(200, data, "Rider earnings fetched successfully"));
});
