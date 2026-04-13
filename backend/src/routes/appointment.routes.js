import { Router } from "express";
import {
  bookAppointment,
  getPartnerAppointments,
  getPatientAppointments,
  updateAppointmentStatus,
  markOrderDispatched,
  markSampleCollected,
  uploadReport,
  getReportsByPatient,
  getReportByAppointment,
  getAllAppointments,
  startVideoCall,
  endVideoCall,
  getAvailableSlots,
  uploadPrescription,
} from "../controllers/appointment.controller.js";

const router = Router();

router.get("/slots", getAvailableSlots);
router.post("/book", bookAppointment);
router.get("/all", getAllAppointments);
router.get("/partner/:email", getPartnerAppointments);
router.get("/patient/:email", getPatientAppointments);
router.patch("/:id/status", updateAppointmentStatus);
router.patch("/:id/dispatch", markOrderDispatched);
router.patch("/:id/sample", markSampleCollected);
router.patch("/:id/video/start", startVideoCall);
router.patch("/:id/video/end", endVideoCall);
router.patch("/:id/prescription", uploadPrescription);

// Reports (nested under appointments for simplicity)
router.post("/report/upload", uploadReport);
router.get("/report/patient/:email", getReportsByPatient);
router.get("/report/appointment/:appointmentId", getReportByAppointment);

export default router;
