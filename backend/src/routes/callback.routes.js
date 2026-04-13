import { Router } from "express";
import { addCallbackRequest, getAllCallbacks, updateCallbackStatus } from "../controllers/callback.controller.js";

const router = Router();

router.post("/", addCallbackRequest);
router.get("/all", getAllCallbacks);
router.patch("/:id", updateCallbackStatus);

export default router;
