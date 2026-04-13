import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Routes ──────────────────────────────────────────
import authRouter           from "./routes/auth.routes.js";
import appointmentRouter    from "./routes/appointment.routes.js";
import medicineRouter       from "./routes/medicine.routes.js";
import labtestRouter        from "./routes/labtest.routes.js";
import notificationRouter   from "./routes/notification.routes.js";
import complaintRouter      from "./routes/complaint.routes.js";
import partnerRouter        from "./routes/partner.routes.js";
import locationRouter       from "./routes/location.routes.js";
import doctorRouter         from "./routes/doctor.routes.js";
import orderRouter          from "./routes/order.routes.js";
import riderRouter          from "./routes/rider.routes.js";
import labAvailabilityRouter from "./routes/labAvailability.routes.js";
import callbackRouter      from "./routes/callback.routes.js";

const app = express();

// Resolve __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Ensure public/temp directory exists for multer uploads
const tempDir = path.join(__dirname, "..", "..", "public", "temp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log("Created directory:", tempDir);
}

// ── CORS ────────────────────────────────────────────
// Supports: localhost (dev), any configured CORS_ORIGIN (prod), and null origin (same-origin/testing)
const allowedOrigins = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow localhost in any port
        if (allowedOrigins.some((pattern) => pattern.test(origin))) {
            return callback(null, true);
        }

        // Allow explicitly configured production origin(s)
        const configuredOrigin = process.env.CORS_ORIGIN;
        if (configuredOrigin) {
            const origins = configuredOrigin.split(",").map((o) => o.trim());
            if (origins.includes(origin)) return callback(null, true);
        }

        console.error(`[CORS REJECTED] Origin: ${origin}. Add this to CORS_ORIGIN env var.`);
        callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    credentials: true,
}));

// ── Request Logger ───────────────────────────────────
// Only log in development to reduce noise on Render logs
if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Root Health Check (required for Render health checks) ───
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "D2D Pharma API is running 🚀",
        version: "1.0.0",
        env: process.env.NODE_ENV || "development",
    });
});
app.head("/", (req, res) => res.sendStatus(200));

// ── Diagnostic Test Route ────────────────────────────
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend is reachable!",
        port: process.env.PORT,
        env: process.env.NODE_ENV || "development",
    });
});

// Serve static files using absolute path (safe on Render)
app.use(express.static(path.join(__dirname, "..", "..", "public")));



// ── API Routes ───────────────────────────────────────
app.use("/api/auth",             authRouter);
app.use("/api/appointments",     appointmentRouter);
app.use("/api/medicines",        medicineRouter);
app.use("/api/labtests",         labtestRouter);
app.use("/api/notifications",    notificationRouter);
app.use("/api/complaints",       complaintRouter);
app.use("/api/partners",         partnerRouter);
app.use("/api/location",         locationRouter);
app.use("/api/doctor",           doctorRouter);
app.use("/api/orders",           orderRouter);
app.use("/api/riders",           riderRouter);
app.use("/api/lab-availability", labAvailabilityRouter);
app.use("/api/callbacks",        callbackRouter);

// ── 404 Fallback ─────────────────────────────────────
app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found on this server.`,
        availableEndpoints: [
            "/api/auth/login",
            "/api/auth/register",
            "/api/partners/all",
            "/api/test",
        ],
    });
});

// ── Global Error Handler ─────────────────────────────
app.use((err, req, res, next) => {
    // Log error details to console (Render captures this in logs)
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err.message);
    if (process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        // Only expose stack trace in development
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
});

export { app };
