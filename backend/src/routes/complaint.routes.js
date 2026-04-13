import { Router } from "express";
import { submitComplaint, getAllComplaints, updateComplaint } from "../controllers/complaint.controller.js";

const router = Router();

router.post("/", submitComplaint);
router.get("/all", getAllComplaints);
router.patch("/:id", updateComplaint);

export default router;
