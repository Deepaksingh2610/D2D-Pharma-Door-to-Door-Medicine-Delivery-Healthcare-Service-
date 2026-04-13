import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAppointment } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import {
  FaUserMd, FaMapMarkerAlt, FaStar, FaStethoscope,
  FaArrowRight, FaCalendarAlt, FaTimes, FaClock, FaClinicMedical, FaChevronLeft, FaVideo, FaCheck
} from "react-icons/fa";
import PaymentPanel from "../components/PaymentPanel";

/* ─────────────────────────────────────────────
   APPOINTMENT MODAL
   ───────────────────────────────────────────── */
const AppointmentModal = ({ doctor, onClose }) => {
  const { bookAppointment } = useAppointment();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [payStep, setPayStep] = useState(false);   // true = show payment
  const [formData, setFormData] = useState(null);
  const [paying, setPaying] = useState(false);
  const [consultationType, setConsultationType] = useState("physical");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name:  user?.name  || "",
      phone: user?.phone || "",
      email: user?.email || "",
      dob:   user?.dob   || "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "",
    }
  });

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedAppt, setBookedAppt] = useState(null);
  const selectedDate = watch("appointmentDate");
  const selectedTime = watch("appointmentTime");

  useEffect(() => {
    if (selectedDate && doctor._id) {
      fetchSlots();
    }
  }, [selectedDate, doctor._id]);

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiUrl}/doctor/slots?doctorId=${doctor?._id || doctor?.id}&partnerEmail=${doctor.email}&partnerRole=doctor&date=${selectedDate}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch slots error status:", res.status, text.slice(0, 100));
        setSlots([]); 
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSlots(data.data);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };


  const onSubmit = (data) => {
    if (!selectedTime) {
      alert("Please select a time slot");
      return;
    }
    setFormData(data);
    setPayStep(true);
  };

  const onPay = async ({ method, detail }) => {
    setPaying(true);
    const selectedFee = consultationType === "video" ? (doctor.onlineFees || doctor.fees) : doctor.fees;
    try {
      const res = await bookAppointment({
        ...formData,
        patientEmail: user?.email || formData.email,
        partnerEmail: doctor.email,
        partnerRole: "doctor",
        partnerName: doctor.name,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        clinicName: doctor.clinicName || doctor.name,
        location: doctor.location,
        fees: selectedFee,
        consultationType,
        paymentMethod: method,
        paymentDetail: detail,
        paymentStatus: "paid",
        amount: selectedFee || 0,
      });
      setBookedAppt(res);
      setPaying(false);
      setSubmitted(true);
    } catch (err) {
      alert(err.message || "Booking failed");
      setPaying(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50
     ${hasError ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-300 focus:border-transparent"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-2xl p-5 flex items-start justify-between">
          <div>
            <h2 className="text-white text-lg font-bold">Book Appointment</h2>
            <p className="text-blue-100 text-sm mt-0.5">{doctor.name} • {doctor.specialty}</p>
            <p className="text-blue-200 text-xs mt-1 flex items-center gap-1">
              <FaClinicMedical /> {doctor.clinicName || doctor.name}, {doctor.location}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition">
            <FaTimes className="text-lg" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <FaCheck className="text-3xl text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Booking Successful! 🎉</h3>
            <p className="text-gray-500 text-sm mb-4">
              Your appointment with <strong>Dr. {doctor.name}</strong> has been secured.
            </p>
            
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl mb-8">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Your Token Number</p>
               <h4 className="text-3xl font-black text-blue-800 tracking-wider">
                 {bookedAppt?.tokenNumber || "D2D-DOC-PENDING"}
               </h4>
               <p className="text-[10px] text-blue-400 mt-3 flex items-center justify-center gap-1 font-bold">
                 <FaClock /> {formData?.appointmentDate} at {formData?.appointmentTime}
               </p>
            </div>

            <button onClick={onClose} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition active:scale-95">
              Confirm & Close
            </button>
          </div>
        ) : payStep ? (
          <div className="p-5">
            <button type="button" onClick={() => setPayStep(false)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 font-medium">
              <FaChevronLeft className="text-xs" /> Back to Details
            </button>
            <PaymentPanel amount={doctor.fees || 0} onPay={onPay} processing={paying}
              label={`Pay ₹${doctor.fees || 0} · Confirm Appointment`} />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Full Name *</label>
              <input type="text" placeholder="Enter your full name" className={inputClass(errors.name)}
                {...register("name", { required: "Full name is required", minLength: { value: 2, message: "Min 2 characters" } })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Phone Number *</label>
              <input type="tel" placeholder="10-digit mobile number" className={inputClass(errors.phone)}
                {...register("phone", { required: "Phone number is required", pattern: { value: /^[6-9]\d{9}$/, message: "Enter valid 10-digit number" } })} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Email Address *</label>
              <input type="email" placeholder="your@email.com" className={inputClass(errors.email)}
                {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter valid email" } })} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            {/* DOB */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Date of Birth *</label>
              <input type="date" className={inputClass(errors.dob)} max={new Date().toISOString().split("T")[0]}
                {...register("dob", { required: "Date of birth is required" })} />
              {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
            </div>
            {/* Consultation Mode */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Consultation Mode *</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConsultationType("physical")}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
                    ${consultationType === "physical" ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"}`}>
                  <FaClinicMedical className={consultationType === "physical" ? "text-white" : "text-blue-500"} />
                  <span className="text-xs font-bold leading-none">Physical Visit</span>
                  <span className="text-[10px] opacity-80">₹{doctor.fees || 0}</span>
                </button>
                <button type="button" onClick={() => setConsultationType("video")}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
                    ${consultationType === "video" ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"}`}>
                  <FaVideo className={consultationType === "video" ? "text-white" : "text-blue-500"} />
                  <span className="text-xs font-bold leading-none">Video Call</span>
                  <span className="text-[10px] opacity-80">₹{doctor.onlineFees || doctor.fees || 0}</span>
                </button>
              </div>
            </div>

            {/* Date & Time Selection (Ticket Booking Style) */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">1. Choose Date</label>
                <input type="date" className={`${inputClass(errors.appointmentDate)} mt-1.5`} min={new Date().toISOString().split("T")[0]}
                  {...register("appointmentDate", { required: "Please select a date" })} />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">2. Select Available Slot</label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-4 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold">Fetching slots...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-1.5">
                    <FaClock className="mx-auto text-gray-300 text-xl mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase">No slots available for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {slots.map(s => (
                      <button key={s.time} type="button" 
                        onClick={() => {
                          if (!s.available) {
                            alert(`This slot (${s.time}) is already full. Please select another time.`);
                            return;
                          }
                          setValue("appointmentTime", s.time);
                        }}
                        className={`py-2.5 rounded-xl border text-[10px] font-black transition-all text-center
                          ${selectedTime === s.time 
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" 
                            : s.available 
                              ? "bg-white text-gray-600 border-gray-200 hover:border-blue-300" 
                              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}>
                        {s.time}
                        {!s.available && <span className="block text-[8px] font-black opacity-80 uppercase">Full</span>}
                      </button>
                    ))}
                  </div>
                )}
                {errors.appointmentTime && <p className="text-red-500 text-[10px] font-bold mt-1 px-1 uppercase">{errors.appointmentTime.message}</p>}
              </div>
            </div>
            {/* Reason */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Reason for Visit *</label>
              <textarea rows={3} placeholder="Describe your symptoms or reason..." className={`${inputClass(errors.reason)} resize-none`}
                {...register("reason", { required: "Please describe your reason", minLength: { value: 10, message: "Min 10 characters" } })} />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
            </div>
            {/* Fee */}
            {(consultationType === "video" ? (doctor.onlineFees || doctor.fees) : doctor.fees) > 0 && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
                <span className="text-gray-600 font-medium">Consultation Fee</span>
                <span className="text-blue-700 font-bold text-lg">
                  ₹{consultationType === "video" ? (doctor.onlineFees || doctor.fees) : doctor.fees}
                </span>
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2">
              <FaCalendarAlt /> Proceed to Payment
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DOCTORS PAGE
───────────────────────────────────────────── */
const Doctors = () => {
  const { getPartnersByRole } = useAppointment();
  const { location } = useLocation();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [filterSpecialty, setFilterSpecialty] = useState("All");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPartnersByRole("doctor").then((data) => {
      setDoctors(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter by detected location (city first, then area)
  const matchesLocation = (doc) => {
    const userCity = location?.city?.toLowerCase();
    const userArea = location?.area?.toLowerCase();
    if (!userCity && !userArea) return true; // No location set, show all
    const docLoc = (doc.location || doc.fullAddress || doc.city || "").toLowerCase();
    const docCity = (doc.city || "").toLowerCase();
    if (userCity && (docCity.includes(userCity) || docLoc.includes(userCity))) return true;
    if (userArea && docLoc.includes(userArea)) return true;
    return false;
  };
  const showAll = !location?.city && !location?.area;
  const byArea = showAll ? doctors : doctors.filter(matchesLocation);

  const specialties = ["All", ...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
  const filtered = filterSpecialty === "All" ? byArea : byArea.filter((d) => d.specialty === filterSpecialty);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Find Doctors</h1>
          <p className="text-gray-500 mt-1">
            {location?.city
              ? <>Showing specialists in <span className="font-semibold text-blue-600">{[location.area, location.city].filter(Boolean).join(", ")}</span>{" "}— {filtered.length} found
                {!showAll && byArea.length === 0 && <span className="text-orange-500"> (No doctors found in your area, showing all)</span>}
                </>
              : "Book appointments with verified doctors"}
          </p>
        </div>

        {/* Specialty Filter Pills */}
        {specialties.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {specialties.map((s) => (
              <button key={s} onClick={() => setFilterSpecialty(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${filterSpecialty === s ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading doctors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <FaUserMd className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl text-gray-500 font-semibold">No doctors registered yet</h3>
            <p className="text-gray-400 mt-1">Doctors will appear here after they sign up on D2D Pharma.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((doc) => (
              <div key={doc.email} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                {/* Avatar */}
                <div className="relative h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden border-2 border-white">
                    {doc.profilePhoto ? (
                      <img src={doc.profilePhoto} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      doc.name?.charAt(0) || "D"
                    )}
                  </div>
                  {doc.specialty && (
                    <div className="absolute bottom-3 left-3 bg-blue-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      {doc.specialty}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                    <FaStar className="text-yellow-400" /> {doc.rating?.toFixed(1) || "5.0"}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{doc.name}</h3>
                  {doc.specialty && (
                    <p className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-1">
                      <FaStethoscope className="text-xs" /> {doc.specialty}
                    </p>
                  )}
                  <div className="mt-3 space-y-1.5 text-sm text-gray-500 flex-1">
                    {doc.location && (
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" /> {doc.location}
                      </p>
                    )}
                    {doc.clinicName && (
                      <p className="flex items-center gap-2">
                        <FaClinicMedical className="text-gray-400 flex-shrink-0" /> {doc.clinicName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
                    <div className="flex flex-col gap-0.5">
                      {Number(doc.fees) > 0 || Number(doc.onlineFees) > 0 ? (
                        <>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-xl font-bold text-gray-800">₹{doc.fees || doc.onlineFees}</p>
                            {doc.onlineFees && doc.fees && doc.onlineFees !== doc.fees && (
                              <p className="text-[10px] text-gray-400 font-medium line-through">₹{doc.onlineFees}</p>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Starting Consultation Fee</p>
                        </>
                      ) : (
                        <p className="text-sm text-green-600 font-semibold">Free Consult.</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {doc.onlineFees && (
                        <div className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-100">
                          <FaVideo className="text-[8px]" /> Video Consult Available
                        </div>
                      )}
                      <button onClick={() => setSelectedDoctor(doc)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-md shadow-blue-200 active:scale-95">
                        Book Now <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDoctor && (
        <AppointmentModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}
    </div>
  );
};

export default Doctors;
