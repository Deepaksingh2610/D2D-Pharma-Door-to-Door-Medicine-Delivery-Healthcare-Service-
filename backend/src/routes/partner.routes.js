import { Router } from "express";
import {
  getPartnersByRole,
  getAllPartners,
  getPartnerByEmail,
  updatePartnerProfile,
  approvePartner,
  rejectPartner,
} from "../controllers/partner.controller.js";

const router = Router();

router.get("/all", getAllPartners);
router.get("/role/:role", getPartnersByRole);
router.get("/:role/:email", getPartnerByEmail);
router.patch("/:role/:email", updatePartnerProfile);
router.patch("/:role/:email/approve", approvePartner);
router.patch("/:role/:email/reject", rejectPartner);

export default router;
