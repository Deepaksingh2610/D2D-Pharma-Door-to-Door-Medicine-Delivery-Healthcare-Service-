import { Router } from "express";
import { addLabTest, getLabTestsByLab, getAllLabTests, deleteLabTest, updateLabTest } from "../controllers/labtest.controller.js";

const router = Router();

router.post("/", addLabTest);
router.get("/all", getAllLabTests);
router.get("/lab/:email", getLabTestsByLab);
router.patch("/:id", updateLabTest);
router.delete("/:id", deleteLabTest);

export default router;
