import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const doctorSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, default: "doctor" },
        approved: { type: Boolean, default: false },
        
        // Step 0 - Personal
        gender: { type: String },
        dob: { type: String },
        profilePhoto: { type: String }, // Cloudinary URL

        // Step 1 - Govt ID
        idType: { type: String },
        idNumber: { type: String },
        idPhoto: { type: String }, // Cloudinary URL

        // Step 2 - Medical Council
        councilName: { type: String },
        regYear: { type: Number },
        regNumber: { type: String },
        qualification: { type: String },
        specialty: { type: String },
        licenseDoc: { type: String }, // Cloudinary URL
        regCertDoc: { type: String }, // Cloudinary URL

        // Step 3 - Clinic Details
        clinicName: { type: String },
        area: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        location: { type: String },
        fullAddress: { type: String },
        consultationTimings: { type: String },
        fees: { type: Number },
        onlineFees: { type: Number },
        onlineTimings: { type: String },
        
        // Step 4 - Bank Details
        bank: {
            accountHolder: { type: String },
            bankName: { type: String },
            accountNumber: { type: String },
            ifsc: { type: String },
            cancelledCheque: { type: String } // Cloudinary URL
        }
    },
    { timestamps: true }
);

doctorSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

doctorSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

export const Doctor = mongoose.model("Doctor", doctorSchema);
