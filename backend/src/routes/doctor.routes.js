import { Router } from "express";
import { upsertAvailability, getDoctorAvailability } from "../controllers/availability.controller.js";
import { getAvailableSlots, getPartnerAppointments } from "../controllers/appointment.controller.js";

const router = Router();

// Availability
router.post("/availability", upsertAvailability);
router.put("/availability", upsertAvailability);
router.get("/availability/:doctorId", getDoctorAvailability);

// Slots
router.get("/slots", getAvailableSlots);

// Bookings per doctor
router.get("/bookings/:email", getPartnerAppointments);

export default router;
