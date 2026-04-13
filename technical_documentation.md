# D2D-Pharma: Technical Documentation & System Architecture
**Version:** 1.2 (Stable)  
**Date:** April 5, 2026  
**Presented by:** Deepak Singh  

---

## 1. Project Overview
D2D-Pharma is an integrated healthcare logistics and tele-medicine platform. It serves as a unified bridge between **Patients**, **Doctors**, **Laboratories**, and **Delivery Riders**. The system is optimized for high-speed medicine delivery and automated diagnostic scheduling with zero-wait time tokens.

---

## 2. Technology Stack (MERN Extended)

### Frontend (User Interface)
- **React.js 19**: Modern component-based architecture with Concurrent Rendering for seamless UI.
- **Vite**: Ultra-fast build tool and development server for optimized frontend performance.
- **Tailwind CSS 4.0**: Utility-first CSS framework for a responsive, "Mobile-First" medical design.
- **Leaflet.js**: Lightweight mobile-friendly interactive mapping system for location-sensitive delivery.
- **Axios**: Promised-based HTTP client for secure and reliable API communication.

### Backend (Server Logic)
- **Node.js**: Asynchronous event-driven JavaScript runtime for high-concurrency requests.
- **Express.js 5**: Robust routing and middleware framework (latest major version).
- **MongoDB Atlas**: Fully managed NoSQL cloud database for flexible clinical data.
- **Mongoose 9**: Powerful Object-Relational Mapping (ORM) for schema-based data modeling.

### Cloud & Third-Party Integrations
- **Cloudinary**: End-to-end encrypted cloud storage for sensitive Lab Reports and Prescriptions.
- **Nodemailer (SMTP)**: Automated email notification engine and OTP security system.
- **Razorpay**: Integrated payment gateway for secure medical billing and insurance.
- **Jitsi Meet**: SDK-based high-definition video consultation between Doctors and Patients.

---

## 3. Database Architecture (Key Schemas)

### A. Appointment Schema
Handles both Doctor Consultations and Lab Visit Slots.
- `patientEmail`: Primary reference to User identity.
- `partnerEmail`: Reference to Doctor or Lab partner.
- `isCenterVisit`: Boolean flag (Triggered by diagnostic test categories like MRI/X-Ray).
- `tokenNumber`: Unique daily sequence generated for laboratory visits.
- `selectedTests`: JSON array of nested Lab Test objects with quantity and price capturing.

### B. Lab Availability Schema (Proprietary Slot Logic)
- `availableDays`: Array of active working days (e.g. ["Monday", "Wednesday", "Sunday"]).
- `morning/evening`: Nested time configuration objects for multi-shift laboratory operations.
- `slotDuration`: Time-granularity enum (15, 30, or 60 minutes).
- `capacity`: Maximum patience/samples per time slot to prevent overcrowding.

---

## 4. Key System Flows (Sequence)

### I. Diagnostic Booking Flow (Center Visits)
1. **Selection**: Patient selects "MRI" or "Ultrasound" from the lab test directory.
2. **Detection**: System triggers `isCenterVisit = true` while disabling "Home Collection" options.
3. **Fetching**: Backend parses `YYYY-MM-DD` and checks the `availableDays` array for a match.
4. **Allocation**: Backend calculates remaining capacity by comparing the `Slot` collection with `LabAvailability`.
5. **Confirmation**: Patient completes payment, and a Token is generated to secure their laboratory time-slot.

### II. Medicine Delivery Flow
1. **Order Placement**: User uploads a prescription or picks from the live pharmacy inventory.
2. **Location Hook**: `Leaflet.js` calculates real-time distance between Patient and nearest Pharmacy.
3. **Rider Assignment**: Riders within 10km receive priority push notifications for acceptance.
4. **OTP Security**: A secure 6-digit delivery OTP is required to mark the order as "Verified Delivered."

---

## 5. Security & Performance
- **Case Normalization**: All emails are standardized to lower-case to prevent authentication and data-leakage bugs.
- **Data Hashing**: Multi-layer security using **Bcrypt** for password and sensitive credential protection.
- **CORS Management**: Access restricted to authorized frontend origins.
- **Lazy Loading**: Components are loaded on-demand to maintain 60FPS performance on mobile devices.

---

## 6. Future Roadmap
- **AI Diagnosis Integration**: Automated preliminary report reading using Machine Learning.
- **Blockchain Records**: Decentralized medical history for 100% patient data integrity.
- **Smart Logistics**: Route optimization for riders using advanced Matrix Routing APIs.
