import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            index: true,
            lowercase: true,
        },
        otp: {
            type: String,
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 600, // 10 minutes TTL
        },
    },
    { timestamps: true }
);

export const OTP = mongoose.model("OTP", otpSchema);
