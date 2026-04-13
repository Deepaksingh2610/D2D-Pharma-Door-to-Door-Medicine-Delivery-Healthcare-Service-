import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// NOTE: dotenv.config() is intentionally NOT called here.
// It is already called in src/index.js before this module is imported,
// so process.env variables are already available at this point.

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded to Cloudinary:", response.url);

        // Delete the local temp file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        // Remove the locally saved temp file even if upload fails
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary Upload Error:", error.message);
        return null;
    }
};

export { uploadOnCloudinary };
