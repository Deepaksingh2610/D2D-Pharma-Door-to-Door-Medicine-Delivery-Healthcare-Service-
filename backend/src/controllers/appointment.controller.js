import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Appointment } from "../models/appointment.model.js";
import { Notification } from "../models/notification.model.js";
import { Report } from "../models/report.model.js";
import { DoctorAvailability } from "../models/doctorAvailability.model.js";
import { LabAvailability } from "../models/labAvailability.model.js";
import { Slot } from "../models/slot.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Lab } from "../models/lab.model.js";

// Helper: Generate time slots
const generateSlots = (start, end, duration) => {
  const slots = [];
  let curr = new Date(`1970-01-01T${start}:00`);
  const stop = new Date(`1970-01-01T${end}:00`);

  while (curr < stop) {
    const next = new Date(curr.getTime() + duration * 60000);
    if (next > stop) break;
    
    const startStr = curr.toTimeString().slice(0, 5);
    const endStr = next.toTimeString().slice(0, 5);
    slots.push(`${startStr} - ${endStr}`);
    curr = next;
  }
  return slots;
};

// GET /api/appointments/slots
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { partnerEmail, partnerRole, date, doctorId, labId } = req.query; 
  
  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  let availability;
  let finalPartnerEmail = partnerEmail?.toLowerCase();

  if (doctorId || partnerRole === "doctor") {
    let doctor;
    if (doctorId) {
      doctor = await Doctor.findById(doctorId);
    } else {
      doctor = await Doctor.findOne({ email: partnerEmail.toLowerCase() });
    }

    if (!doctor) throw new ApiError(404, "Doctor not found");
    finalPartnerEmail = doctor.email;
    availability = await DoctorAvailability.findOne({ doctorId: doctor._id });
  } else if (labId || partnerRole === "lab") {
    if (labId) {
      availability = await LabAvailability.findOne({ labId });
    } else {
      availability = await LabAvailability.findOne({ labEmail: partnerEmail.toLowerCase() });
    }
    if (availability) finalPartnerEmail = availability.labEmail;
  }

  if (!availability) {
    return res.status(200).json(new ApiResponse(200, [], "The provider has not configured their availability for center visits yet."));
  }


  // Check if day is available
  const [y, m, d] = date.split("-").map(Number);
  const dayName = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
  
  if (!availability.availableDays.includes(dayName)) {
    return res.status(200).json(new ApiResponse(200, [], `Partner is not available on ${dayName} (${date})` || "Partner is not available on this day"));
  }

  const generateSlots = (start, end, duration) => {
    const slots = [];
    let [h, min] = start.split(":").map(Number);
    let [eh, emin] = end.split(":").map(Number);
    
    let currentMins = h * 60 + min;
    const endMins = eh * 60 + emin;
    
    while (currentMins + duration <= endMins) {
      const sh = Math.floor(currentMins / 60);
      const sm = currentMins % 60;
      const eh_next = Math.floor((currentMins + duration) / 60);
      const em_next = (currentMins + duration) % 60;
      
      const startStr = `${sh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`;
      const endStr = `${eh_next.toString().padStart(2, "0")}:${em_next.toString().padStart(2, "0")}`;
      
      slots.push(`${startStr} - ${endStr}`);
      currentMins += duration;
    }
    return slots;
  };

  const morningSlots = (availability.morning && availability.morning.active) ? generateSlots(availability.morning.start, availability.morning.end, availability.slotDuration) : [];
  const eveningSlots = (availability.evening && availability.evening.active) ? generateSlots(availability.evening.start, availability.evening.end, availability.slotDuration) : [];

  const allSlotTimes = [
    ...morningSlots.map(s => ({ time: s, type: "morning" })),
    ...eveningSlots.map(s => ({ time: s, type: "evening" }))
  ];

  // Fetch already booked slots for this day
  const bookedSlots = await Slot.find({ partnerEmail: finalPartnerEmail, date });

  const bookedMap = bookedSlots.reduce((acc, s) => {
    acc[s.slotTime] = s.bookedCount;
    return acc;
  }, {});

  const finalSlots = allSlotTimes.map(s => ({
    ...s,
    available: (bookedMap[s.time] || 0) < availability.capacityPerSlot,
    bookedCount: bookedMap[s.time] || 0,
    capacity: availability.capacityPerSlot
  }));

  return res.status(200).json(new ApiResponse(200, finalSlots, "Slots fetched successfully"));
});

// Helper: push a notification to DB
const pushNotification = async (data) => {
  try {
    await Notification.create({
      targetEmail: data.targetEmail,
      patientEmail: data.patientEmail || data.targetEmail,
      appointmentId: data.appointmentId || null,
      type: data.type || "general",
      message: data.message,
      read: false,
      ...(data.reportId && { reportId: data.reportId }),
    });
  } catch (e) {
    console.error("Notification push failed:", e.message);
  }
};

// POST /api/appointments/book
export const bookAppointment = asyncHandler(async (req, res) => {
  const {
    patientEmail, name, phone, dob, reason,
    partnerEmail, partnerRole, partnerName,
    appointmentDate, appointmentTime, consultationType,
    fees, amount, paymentStatus, paymentMethod,
    storeName, labName,
  } = req.body;

  // Handle slots and tokens for Doctor OR Lab Center Visit
  let tokenNumber = "";
  if (partnerRole === "doctor" || (partnerRole === "lab" && req.body.isCenterVisit)) {
    let availability;
    let partnerId;

    const normalizedEmail = partnerEmail.toLowerCase();
    if (partnerRole === "doctor") {
      const doctor = await Doctor.findOne({ email: normalizedEmail });
      if (!doctor) throw new ApiError(404, "Doctor not found");
      partnerId = doctor._id;
      availability = await DoctorAvailability.findOne({ doctorId: partnerId });
    } else {
      const lab = await Lab.findOne({ email: normalizedEmail });
      if (!lab) throw new ApiError(404, "Lab not found");
      partnerId = lab._id;
      availability = await LabAvailability.findOne({ labEmail: normalizedEmail });
    }

    if (!availability) throw new ApiError(404, `${partnerRole} availability not set`);

    // Atomic update or find and check capacity
    let slotRecord = await Slot.findOne({ partnerEmail, date: appointmentDate, slotTime: appointmentTime });
    
    if (!slotRecord) {
      slotRecord = await Slot.create({
        partnerEmail,
        doctorId: partnerRole === "doctor" ? partnerId : null,
        labId: partnerRole === "lab" ? partnerId : null,
        date: appointmentDate,
        slotTime: appointmentTime,
        type: appointmentTime.split(":")[0] < 12 ? "morning" : "evening",
        capacity: availability.capacityPerSlot,
        bookedCount: 0
      });
    }

    if (slotRecord.bookedCount >= slotRecord.capacity) {
      throw new ApiError(400, "This slot is already full");
    }

    // Increment bookedCount
    slotRecord.bookedCount += 1;
    await slotRecord.save();

    // Count existing appointments for this partner and date to generate sequential Token #
    const dayCount = await Appointment.countDocuments({
      partnerEmail: partnerEmail,
      appointmentDate: appointmentDate
    });
    tokenNumber = `Token #${dayCount + 1}`;
  }

  const appt = await Appointment.create({
    patientEmail, name, phone, dob, reason,
    partnerEmail, partnerRole, partnerName,
    appointmentDate, appointmentTime,
    consultationType: consultationType || "physical",
    fees: Number(fees) || 0,
    amount: Number(amount) || Number(fees) || 0,
    paymentStatus: paymentStatus || "pending",
    paymentMethod,
    storeName, labName,
    status: (partnerRole === "doctor" || (partnerRole === "lab" && req.body.isCenterVisit)) ? "accepted" : "pending",
    tokenNumber,
    slotTime: appointmentTime,
    homeCollectionCharge: Number(req.body.homeCollectionCharge || 0),
    isPackage: !!req.body.isPackage,
    isCenterVisit: !!req.body.isCenterVisit,
    selectedTests: req.body.selectedTests || [],
    bookedAt: new Date(),
  });

  // Notify partner about new booking
  if (partnerRole === "doctor" && partnerEmail) {
    await pushNotification({
      targetEmail: partnerEmail,
      patientEmail,
      appointmentId: appt._id.toString(),
      type: "new_appointment",
      message: `🩺 New appointment request from ${name} for ${appointmentDate} at ${appointmentTime}. Reason: ${reason || "Consultation"}.`,
    });
  } else if (partnerRole === "pharmacy" && partnerEmail) {
    await pushNotification({
      targetEmail: partnerEmail,
      patientEmail,
      appointmentId: appt._id.toString(),
      type: "new_appointment",
      message: `🛒 New medicine order from ${name}. Review and accept.`,
    });
  } else if (partnerRole === "lab" && partnerEmail) {
    await pushNotification({
      targetEmail: partnerEmail,
      patientEmail,
      appointmentId: appt._id.toString(),
      type: "new_appointment",
      message: `🔬 New lab test booking from ${name} for ${reason || "a test"} on ${appointmentDate}.`,
    });
  }

  return res.status(201).json(new ApiResponse(201, appt, "Appointment booked successfully"));
});

// GET /api/appointments/partner/:email
export const getPartnerAppointments = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const appts = await Appointment.find({ partnerEmail: email }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, appts, "Partner appointments fetched"));
});

// GET /api/appointments/patient/:email
export const getPatientAppointments = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const appts = await Appointment.find({ patientEmail: email }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, appts, "Patient appointments fetched"));
});

// PATCH /api/appointments/:id/status
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "accepted", "rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const appt = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
  if (!appt) throw new ApiError(404, "Appointment not found");

  // Send notifications based on status
  if (appt.partnerRole === "doctor") {
    if (status === "accepted" && appt.patientEmail) {
      await pushNotification({
        targetEmail: appt.patientEmail,
        patientEmail: appt.patientEmail,
        appointmentId: id,
        type: "appointment_accepted",
        message: `✅ Your appointment with Dr. ${appt.partnerName || "your doctor"} has been confirmed for ${appt.appointmentDate} at ${appt.appointmentTime}.`,
      });
    } else if (status === "rejected" && appt.patientEmail) {
      await pushNotification({
        targetEmail: appt.patientEmail,
        patientEmail: appt.patientEmail,
        appointmentId: id,
        type: "appointment_rejected",
        message: `❌ Dr. ${appt.partnerName || "the doctor"} could not accept your appointment for ${appt.appointmentDate}. Please book a different time.`,
      });
    }
  }

  if (status === "accepted" && appt.partnerRole === "pharmacy" && appt.patientEmail) {
    await pushNotification({
      targetEmail: appt.patientEmail,
      patientEmail: appt.patientEmail,
      appointmentId: id,
      type: "order_accepted",
      message: `✅ Your order at ${appt.storeName || "the pharmacy"} has been accepted. Medicines will be prepared shortly.`,
    });
  }

  if (status === "accepted" && appt.partnerRole === "lab" && appt.patientEmail) {
    await pushNotification({
      targetEmail: appt.patientEmail,
      patientEmail: appt.patientEmail,
      appointmentId: id,
      type: "order_accepted",
      message: `✅ Your lab test booking at ${appt.labName || "the lab"} has been confirmed for ${appt.appointmentDate}.`,
    });
  }

  return res.status(200).json(new ApiResponse(200, appt, "Status updated"));
});

// PATCH /api/appointments/:id/dispatch
export const markOrderDispatched = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findByIdAndUpdate(
    id,
    { dispatched: true, dispatchedAt: new Date() },
    { new: true }
  );
  if (!appt) throw new ApiError(404, "Appointment not found");

  if (appt.patientEmail) {
    await pushNotification({
      targetEmail: appt.patientEmail,
      patientEmail: appt.patientEmail,
      appointmentId: id,
      type: "order_dispatched",
      message: `🚴 Medicines from ${appt.storeName || "the pharmacy"} have been dispatched and are on the way!`,
    });
  }

  return res.status(200).json(new ApiResponse(200, appt, "Order marked dispatched"));
});

// PATCH /api/appointments/:id/sample
export const markSampleCollected = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findByIdAndUpdate(
    id,
    { sampleCollected: true, sampleCollectedAt: new Date() },
    { new: true }
  );
  if (!appt) throw new ApiError(404, "Appointment not found");

  if (appt.patientEmail) {
    await pushNotification({
      targetEmail: appt.patientEmail,
      patientEmail: appt.patientEmail,
      appointmentId: id,
      type: "sample_collected",
      message: appt.isCenterVisit 
        ? `✅ Laboratory visit completed at ${appt.labName || "the lab"}. Your results will be processed shortly.`
        : `✅ Sample collected for your lab test at ${appt.labName || "the lab"}. Report will be ready in a few hours.`,
    });
  }

  return res.status(200).json(new ApiResponse(200, appt, "Sample marked collected"));
});

// POST /api/appointments/report/upload
export const uploadReport = asyncHandler(async (req, res) => {
  const { appointmentId, fileData, fileName } = req.body;
  if (!appointmentId || !fileData) throw new ApiError(400, "appointmentId and fileData required");

  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new ApiError(404, "Appointment not found");

  const report = await Report.create({
    appointmentId,
    patientEmail: appt.patientEmail,
    labEmail: appt.partnerEmail,
    labName: appt.labName,
    testName: appt.reason,
    fileName,
    fileData,
    uploadedAt: new Date(),
  });

  await Appointment.findByIdAndUpdate(appointmentId, {
    reportUploaded: true,
    reportUploadedAt: new Date(),
  });

  await pushNotification({
    targetEmail: appt.patientEmail,
    patientEmail: appt.patientEmail,
    appointmentId,
    type: "report_ready",
    reportId: report._id.toString(),
    message: `📄 Your lab report from ${appt.labName || "the lab"} is ready! You can download it from your profile.`,
  });

  return res.status(201).json(new ApiResponse(201, report, "Report uploaded"));
});

// GET /api/appointments/report/patient/:email
export const getReportsByPatient = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const reports = await Report.find({ patientEmail: email }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, reports, "Reports fetched"));
});

// GET /api/appointments/report/appointment/:appointmentId
export const getReportByAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const report = await Report.findOne({ appointmentId });
  return res.status(200).json(new ApiResponse(200, report, "Report fetched"));
});

// GET /api/appointments/all  (admin)
// PATCH /api/appointments/:id/video/start
export const startVideoCall = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meetingLink = `https://meet.jit.si/D2DPharma_Consult_${id}`;

  const appt = await Appointment.findByIdAndUpdate(
    id,
    { meetingLink, meetingActive: true },
    { new: true }
  );
  if (!appt) throw new ApiError(404, "Appointment not found");

  if (appt.patientEmail) {
    await pushNotification({
      targetEmail: appt.patientEmail,
      patientEmail: appt.patientEmail,
      appointmentId: id,
      type: "video_call_started",
      message: `🎥 Dr. ${appt.partnerName || "your doctor"} has started your video consultation. Click here to join the call.`,
    });
  }

  return res.status(200).json(new ApiResponse(200, appt, "Video call started"));
});

// PATCH /api/appointments/:id/video/end
export const endVideoCall = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findByIdAndUpdate(
    id,
    { meetingActive: false },
    { new: true }
  );
  if (!appt) throw new ApiError(404, "Appointment not found");

  return res.status(200).json(new ApiResponse(200, appt, "Video call ended"));
});

// PATCH /api/appointments/:id/prescription
export const uploadPrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { prescriptionText, prescriptionImage } = req.body;

  const appt = await Appointment.findByIdAndUpdate(
    id,
    { prescriptionText, prescriptionImage },
    { new: true }
  );
  if (!appt) throw new ApiError(404, "Appointment not found");

  if (appt.patientEmail) {
    await pushNotification({
      targetEmail: appt.patientEmail,
      patientEmail: appt.patientEmail,
      appointmentId: id,
      type: "prescription_uploaded",
      message: `📄 Dr. ${appt.partnerName || "your doctor"} has uploaded your prescription for your consultation on ${appt.appointmentDate}.`,
    });
  }

  return res.status(200).json(new ApiResponse(200, appt, "Prescription uploaded successfully"));
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  const appts = await Appointment.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, appts, "All appointments"));
});
