import { Router } from "express";
import { getMyLabAvailability, saveLabAvailability } from "../controllers/labAvailability.controller.js";

const router = Router();

router.get("/me", getMyLabAvailability);
router.post("/save", saveLabAvailability);

export default router;
