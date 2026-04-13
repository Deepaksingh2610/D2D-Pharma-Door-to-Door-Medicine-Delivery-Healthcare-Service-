import { Router } from "express";
import { addMedicine, getMedicinesByStore, getAllMedicines, deleteMedicine, updateMedicine, bulkAddMedicines } from "../controllers/medicine.controller.js";

const router = Router();

router.post("/", addMedicine);
router.post("/bulk", bulkAddMedicines);
router.get("/all", getAllMedicines);
router.get("/store/:email", getMedicinesByStore);
router.patch("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;
