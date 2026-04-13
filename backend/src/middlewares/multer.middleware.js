import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Resolve __dirname for ESM modules (required for absolute paths on Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Absolute path to temp upload directory (goes up: middlewares → src → backend → public/temp)
const TEMP_DIR = path.join(__dirname, "..", "..", "public", "temp");

// Ensure the temp directory exists at startup
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, TEMP_DIR);
    },
    filename: function (req, file, cb) {
        // Sanitize filename and add timestamp to prevent collisions
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}_${safeName}`);
    },
});

// Only allow images and PDFs
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type '${file.mimetype}' is not allowed. Only images and PDFs are accepted.`), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB per file
    },
});
