import { Router } from "express";
import {
    getAvailableOrders,
    getMyDeliveries,
    acceptDelivery,
    completeDelivery,
    getRiderEarnings,
} from "../controllers/rider.controller.js";


const router = Router();

router.get("/available", getAvailableOrders);
router.get("/my-deliveries/:email", getMyDeliveries);
router.patch("/:id/accept", acceptDelivery);
router.patch("/:id/deliver", completeDelivery);
router.get("/earnings/:email", getRiderEarnings);


export default router;
