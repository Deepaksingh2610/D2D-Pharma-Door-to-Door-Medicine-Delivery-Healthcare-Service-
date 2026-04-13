import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Medicine } from "../models/medicine.model.js";
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

// ─────────────────────────────────────────────
// DISTANCE & EARNINGS
// ─────────────────────────────────────────────

// Haversine formula to get distance in KM
const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
};

// POST /api/orders/calculate-distance
export const calculateDistance = asyncHandler(async (req, res) => {
    const { pickupLat, pickupLng, deliveryLat, deliveryLng } = req.body;
    if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
        throw new ApiError(400, "Pickup and delivery coordinates are required");
    }

    const distance = getHaversineDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
    // Formula: ₹8 per KM inclusive of round trip (distance * 2 * 8)
    const deliveryCharge = Math.ceil(distance * 2 * 8); 

    return res.status(200).json(new ApiResponse(200, {
        distance: Number(distance.toFixed(2)),
        deliveryCharge,
        formula: "distance * 2 * 8 (Round Trip)"
    }, "Distance and charges calculated"));
});

// POST /api/orders/place
export const placeOrder = asyncHandler(async (req, res) => {
    const { 
        patientEmail, customerName, customerPhone, items, totalAmount, 
        deliveryAddress, paymentMethod, paymentStatus, prescriptionUrl, storeEmail, storeName,
        deliveryLat, deliveryLng, pickupLat, pickupLng,
        distance, deliveryCharge, riderEarning, medicineTotal
    } = req.body;

    if (!patientEmail || !items || !items.length || !storeEmail) {
        throw new ApiError(400, "Incomplete order details");
    }

    // 1. Check all medicines and update stock
    const session = await Order.startSession();
    session.startTransaction();

    try {
        for (const item of items) {
            const isPlaceholder = !item.medicineId || item.medicineId === "000000000000000000000000";
            if (isPlaceholder) continue;

            const medicine = await Medicine.findById(item.medicineId).session(session);
            if (!medicine) throw new ApiError(404, `Medicine not found: ${item.name}`);
            
            if (medicine.stock < item.quantity) {
                throw new ApiError(400, `Insufficient stock for ${item.name}. Available: ${medicine.stock}`);
            }
            medicine.stock -= item.quantity;
            await medicine.save({ session });
        }

        // 2. Create Order
        const order = await Order.create([{
            patientEmail, customerName, customerPhone, items, 
            totalAmount: Number(totalAmount),
            deliveryAddress, paymentMethod, 
            paymentStatus: paymentStatus || "pending",
            status: "placed",
            prescriptionUrl, storeEmail, storeName,
            deliveryLat, deliveryLng, pickupLat, pickupLng,
            distance: Number(distance || 0),
            deliveryCharge: Number(deliveryCharge || 0),
            riderEarning: Number(riderEarning || deliveryCharge || 0), // Default rider earning to delivery charge
            medicineTotal: Number(medicineTotal || 0)
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // Notify store about new order
        await pushNotification({
            targetEmail: storeEmail,
            patientEmail,
            type: "new_order",
            message: `🛒 New order received from ${customerName || patientEmail} for ₹${totalAmount}.`,
        });

        return res.status(201).json(new ApiResponse(201, order[0], "Order placed successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// GET /api/rider/earnings/:riderId
export const getRiderEarnings = asyncHandler(async (req, res) => {
    const { riderId } = req.params;
    // Note: riderId is riderEmail in this system
    
    const orders = await Order.find({ riderEmail: riderId, status: "delivered" });

    const totalKM = orders.reduce((sum, o) => sum + (o.distance || 0), 0);
    const totalEarnings = orders.reduce((sum, o) => sum + (o.riderEarning || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.updatedAt) >= today);
    const todayEarnings = todayOrders.reduce((sum, o) => sum + (o.riderEarning || 0), 0);

    return res.status(200).json(new ApiResponse(200, {
        totalKM: Number(totalKM.toFixed(2)),
        totalEarnings,
        todayEarnings,
        completedOrders: orders.length,
        history: orders.map(o => ({
            id: o._id,
            distance: o.distance,
            earning: o.riderEarning,
            status: o.status,
            date: o.updatedAt
        }))
    }, "Rider earnings stats fetched"));
});

// GET /api/orders/patient/:email
export const getPatientOrders = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const orders = await Order.find({ patientEmail: email }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "Patient orders fetched"));
});

// GET /api/orders/store/:email
export const getStoreOrders = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const orders = await Order.find({ storeEmail: email }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "Store orders fetched"));
});

// PATCH /api/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["placed", "confirmed", "dispatched", "out_for_delivery", "delivered", "cancelled"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) throw new ApiError(404, "Order not found");

    // Notify patient about status update
    if (order.patientEmail) {
        let msg = `📦 Your order from ${order.storeName} is now ${status.replace(/_/g, ' ')}.`;
        if (status === "confirmed") msg = `✅ Your order from ${order.storeName} has been confirmed!`;
        if (status === "dispatched") msg = `🚴 Your order from ${order.storeName} has been dispatched!`;
        if (status === "delivered") msg = `🎉 Your order from ${order.storeName} has been delivered. Thank you!`;
        
        await pushNotification({
            targetEmail: order.patientEmail,
            patientEmail: order.patientEmail,
            type: "order_status",
            message: msg,
        });
    }

    return res.status(200).json(new ApiResponse(200, order, `Order status updated to ${status}`));
});

// GET /api/orders/admin/delivery-stats
export const getAdminDeliveryStats = asyncHandler(async (req, res) => {
    // Aggregation for total revenue, payout and distance
    const stats = await Order.aggregate([
        { $match: { status: "delivered" } },
        { 
            $group: {
                _id: null,
                totalRevenue: { $sum: "$deliveryCharge" },
                totalPayout: { $sum: "$riderEarning" },
                totalKM: { $sum: "$distance" }
            }
        }
    ]);

    const result = stats[0] || { totalRevenue: 0, totalPayout: 0, totalKM: 0 };
    result.totalKM = Number(result.totalKM.toFixed(2));

    return res.status(200).json(new ApiResponse(200, result, "Admin delivery stats fetched"));
});

