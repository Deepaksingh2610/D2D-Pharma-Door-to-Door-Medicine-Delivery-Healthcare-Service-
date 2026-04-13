import { Router } from "express";
import { registerUser, loginUser, getAllUsers, sendOTP, verifyOTP } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "profilePhoto", maxCount: 1 },
        { name: "idPhoto", maxCount: 1 },
        { name: "licenseDoc", maxCount: 1 },
        { name: "regCertDoc", maxCount: 1 },
        { name: "cancelledCheque", maxCount: 1 },
        { name: "qualCert", maxCount: 1 },
        { name: "storePhoto", maxCount: 1 },
        { name: "drugLicCert", maxCount: 1 },
        { name: "pharmacistCert", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/users").get(getAllUsers);
router.route("/send-otp").post(sendOTP);
router.route("/verify-otp").post(verifyOTP);

export default router;
