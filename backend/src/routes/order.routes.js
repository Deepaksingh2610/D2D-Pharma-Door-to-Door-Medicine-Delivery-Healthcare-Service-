import { Router } from "express";
import { 
    placeOrder, 
    getPatientOrders, 
    getStoreOrders, 
    updateOrderStatus,
    calculateDistance,
    getRiderEarnings,
    getAdminDeliveryStats
} from "../controllers/order.controller.js";

const router = Router();

router.post("/place", placeOrder);
router.post("/calculate-distance", calculateDistance);
router.get("/patient/:email", getPatientOrders);
router.get("/store/:email", getStoreOrders);
router.get("/rider/earnings/:riderId", getRiderEarnings);
router.get("/admin/delivery-stats", getAdminDeliveryStats);
router.patch("/:id/status", updateOrderStatus);

export default router;
