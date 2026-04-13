import { Router } from "express";
import { getNotifications, createNotification, markNotificationRead, markAllRead } from "../controllers/notification.controller.js";

const router = Router();

router.get("/:email", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markNotificationRead);
router.patch("/readall/:email", markAllRead);

export default router;
