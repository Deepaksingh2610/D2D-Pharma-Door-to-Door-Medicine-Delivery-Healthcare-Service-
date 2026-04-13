import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const labSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, default: "lab" },
        approved: { type: Boolean, default: false },

        // Step 0 - Personal
        profilePhoto: { type: String }, // Cloudinary URL
        dob: { type: String },
        gender: { type: String },
        idType: { type: String },
        idNumber: { type: String },
        idPhoto: { type: String }, // Cloudinary URL

        // Step 1 - Qualification
        qualification: { type: String },
        institute: { type: String },
        yearOfPassing: { type: Number },
        qualCert: { type: String }, // Cloudinary URL

        // Step 2 - Lab Details
        labName: { type: String },
        clinicName: { type: String }, // Used in frontend occasionally
        labRegNumber: { type: String },
        regAuthority: { type: String },
        labArea: { type: String },
        labCity: { type: String },
        labState: { type: String },
        labPincode: { type: String },
        fullAddress: { type: String },
        location: { type: String },
        nablCert: { type: String },
        services: { type: String }, // comma-separated

        // Bank
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

labSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

labSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

export const Lab = mongoose.model("Lab", labSchema);
