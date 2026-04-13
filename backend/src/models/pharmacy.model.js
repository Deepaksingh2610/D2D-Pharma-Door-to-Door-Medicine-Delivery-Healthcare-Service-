import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const pharmacySchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, default: "pharmacy" },
        approved: { type: Boolean, default: false },

        // Step 0 - Personal & ID
        idType: { type: String },
        idNumber: { type: String },
        idPhoto: { type: String }, // Cloudinary URL

        // Step 1 - Store & Licence
        storeName: { type: String },
        clinicName: { type: String }, // Used in frontend occasionally
        storeArea: { type: String },
        storeCity: { type: String },
        storeState: { type: String },
        storePincode: { type: String },
        fullAddress: { type: String },
        location: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        storePhoto: { type: String }, // Cloudinary URL
        
        drugLicRetail: { type: String },
        drugLicWholesale: { type: String },
        drugLicAuthority: { type: String },
        drugLicIssueDate: { type: String },
        drugLicExpiry: { type: String },
        drugLicCert: { type: String }, // Cloudinary URL

        // Step 2 - Pharmacist Registration
        pharmacistName: { type: String },
        pharmacyCouncil: { type: String },
        pharmacistRegNum: { type: String },
        pharmacistQual: { type: String },
        pharmacistCert: { type: String }, // Cloudinary URL

        openFrom: { type: String },
        openTo: { type: String },
        openDays: { type: String },
        storeTimings: { type: String },

        // Step 3 - Bank + GST
        gstNumber: { type: String },
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

pharmacySchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

pharmacySchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

export const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
