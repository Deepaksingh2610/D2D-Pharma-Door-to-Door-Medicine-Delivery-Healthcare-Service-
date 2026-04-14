import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Lab } from "../models/lab.model.js";
import { Pharmacy } from "../models/pharmacy.model.js";
import { OTP } from "../models/otp.model.js";
import { sendOTPEmail } from "../utils/MailService.js";

const uploadFileHelper = async (localPath) => {
    if (!localPath) return null;
    const uploadResult = await uploadOnCloudinary(localPath);
    return uploadResult ? uploadResult.url : null;
};

const registerUser = asyncHandler(async (req, res) => {
    const { role } = req.body;
    
    if (!role) {
        throw new ApiError(400, "Role is required");
    }

    const email = req.body.email?.trim().toLowerCase();
    const { phone, password, name } = req.body;

    if ([email, phone, password, name].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, email, phone and password are required");
    }

    let ModelToUse;
    let existingUser;

    switch(role) {
        case "doctor": ModelToUse = Doctor; break;
        case "lab": ModelToUse = Lab; break;
        case "pharmacy": ModelToUse = Pharmacy; break;
        default: ModelToUse = User; break;
    }

    // MANDATORY BACKEND OTP VERIFICATION (Check verified record exists for email)
    const otpRecord = await OTP.findOne({ email, isVerified: true });
    if (!otpRecord) {
        throw new ApiError(400, "Email not verified via OTP. Please verify your email first.");
    }

    // Check if user exists
    existingUser = await ModelToUse.findOne({
        $or: [{ email }, { phone }]
    });

    if (existingUser) {
        throw new ApiError(409, `${role} with email or phone already exists`);
    }

    // Handle File Uploads
    const files = req.files || {};
    let uploadedUrls = {};

    for (const [key, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
            uploadedUrls[key] = await uploadFileHelper(fileArray[0].path);
        }
    }

    // Parse nested objects if sent as JSON string in form-data
    let bankDetails = {};
    if (req.body.bank) {
        try {
            bankDetails = typeof req.body.bank === "string" ? JSON.parse(req.body.bank) : req.body.bank;
        } catch (error) {
            bankDetails = req.body.bank;
        }
        if (uploadedUrls.cancelledCheque) {
            bankDetails.cancelledCheque = uploadedUrls.cancelledCheque;
        }
    }

    // Prepare data to save
    const dataToSave = {
        ...req.body,
        email,
        ...uploadedUrls,
        bank: Object.keys(bankDetails).length > 0 ? bankDetails : undefined
    };

    // Remove the string bank to not conflict
    if (typeof req.body.bank === "string" && uploadedUrls.cancelledCheque) {
       dataToSave.bank.cancelledCheque = uploadedUrls.cancelledCheque;
    }

    const createdUser = await ModelToUse.create(dataToSave);
    await OTP.deleteOne({ email, isVerified: true });
    const createdUserObj = createdUser.toObject();
    delete createdUserObj.password;

    return res.status(201).json(
        new ApiResponse(201, createdUserObj, `${role} registered successfully`)
    );
});


const loginUser = asyncHandler(async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const { password, role = "user" } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    let ModelToUse;
    switch(role) {
        case "doctor": ModelToUse = Doctor; break;
        case "lab": ModelToUse = Lab; break;
        case "pharmacy": ModelToUse = Pharmacy; break;
        default: ModelToUse = User; break;
    }

    const user = await ModelToUse.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const loggedInUser = user.toObject();
    delete loggedInUser.password;

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: loggedInUser },
            "User logged in successfully"
        )
    );
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: "user" }).select("-password");
    
    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
});

const sendOTP = asyncHandler(async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) throw new ApiError(400, "Email is required");

    // Check if user already exists in ANY role
    const existingInUser = await User.findOne({ email });
    const existingInDoctor = await Doctor.findOne({ email });
    const existingInLab = await Lab.findOne({ email });
    const existingInPharmacy = await Pharmacy.findOne({ email });

    if (existingInUser || existingInDoctor || existingInLab || existingInPharmacy) {
        throw new ApiError(409, "A user with this email already exists across our platform. Please login instead.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.findOneAndUpdate(
        { email },
        { otp, isVerified: false, createdAt: Date.now() },
        { upsert: true, returnDocument: 'after' }
    );

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
        throw new ApiError(500, "Failed to send OTP email");
    }

    return res.status(200).json(new ApiResponse(200, null, "OTP sent successfully"));
});

const verifyOTP = asyncHandler(async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const { otp } = req.body;
    if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    // Instead of deleting, mark it as verified for the register call
    // reset createdAt to give more time for registration
    otpRecord.isVerified = true;
    otpRecord.createdAt = Date.now();
    await otpRecord.save();

    return res.status(200).json(new ApiResponse(200, null, "OTP verified successfully"));
});

export { registerUser, loginUser, getAllUsers, sendOTP, verifyOTP };
