import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useLocation } from "../context/LocationContext";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser, FaLock, FaGoogle, FaFacebook, FaUserMd, FaPrescriptionBottleAlt,
  FaVial, FaHospital, FaRupeeSign, FaStethoscope, FaLocationArrow,
  FaIdCard, FaCamera, FaCheckCircle, FaChevronRight, FaChevronLeft, FaClock, FaSignOutAlt
} from "react-icons/fa";
import { MdEmail, MdPhone, MdVerified } from "react-icons/md";
import logo from "../assets/logo.svg";
import LabKYCWizard from "../components/kyc/LabKYCWizard";
import PharmacyKYCWizard from "../components/kyc/PharmacyKYCWizard";
import { StepBar, PhotoUpload, WizardSection, Err, BankDetailsBlock, toBase64 } from "../components/kyc/KYCShared";

/* ──────────────────────────────────────────────────────────────
   DOCTOR KYC WIZARD (5 steps — with bank details)
────────────────────────────────────────────────────────────── */
const DoctorKYCWizard = ({ onComplete }) => {
  const { nearestArea, getGeoAddress, fastDetectLocation } = useLocation();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Step 0 – Personal
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Step 1 – Govt ID
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState(null);

  // Step 2 – Medical Council
  const [councilName, setCouncilName] = useState("");
  const [regYear, setRegYear] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [regCertDoc, setRegCertDoc] = useState(null);

  // Step 3 – Clinic
  const [clinicName, setClinicName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [fees, setFees] = useState("");
  const [onlineFees, setOnlineFees] = useState("");
  const [onlineTo, setOnlineTo] = useState("18:00");
  const [availableDays, setAvailableDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
  const [morning, setMorning] = useState({ start: "09:00", end: "12:00", active: true });
  const [evening, setEvening] = useState({ start: "17:00", end: "20:00", active: true });
  const [consultationTypes, setConsultationTypes] = useState(["physical"]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [capacityPerSlot, setCapacityPerSlot] = useState(5);
  const [locDetecting, setLocDetecting] = useState(false);

  // Step 4 – Bank
  const [bank, setBank] = useState({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", cancelledCheque: null });
  const setB = (k, v) => setBank(prev => ({ ...prev, [k]: v }));

  const STEPS = ["Personal", "Govt ID", "Medical", "Clinic", "Bank"];

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!name.trim()) e.name = "Name is required";
      if (!gender) e.gender = "Select gender";
      if (!dob) e.dob = "Date of birth required";
      if (!profilePhoto) e.profilePhoto = "Profile photo required";
    }
    if (step === 1) {
      if (!idNumber.trim()) e.idNumber = "ID number required";
      if (idType === "aadhaar" && !/^\d{12}$/.test(idNumber.trim())) e.idNumber = "Aadhaar must be 12 digits";
      if (idType === "pan" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(idNumber.trim())) e.idNumber = "Invalid PAN";
      if (!idPhoto) e.idPhoto = "ID proof photo required";
    }
    if (step === 2) {
      if (!councilName.trim()) e.councilName = "Council name required";
      if (!regYear || isNaN(regYear) || regYear < 1950 || regYear > new Date().getFullYear()) e.regYear = "Valid year required";
      if (!regNumber.trim()) e.regNumber = "Registration number required";
      if (!qualification.trim()) e.qualification = "Qualification required";
      if (!specialty) e.specialty = "Specialty required";
      if (!licenseDoc) e.licenseDoc = "Medical license upload required";
    }
    if (step === 3) {
      if (!clinicName.trim()) e.clinicName = "Clinic name required";
      if (!area.trim()) e.area = "Area required";
      if (!city.trim()) e.city = "City required";
      if (!state.trim()) e.state = "State required";
      if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) e.pincode = "Valid 6-digit pincode required";
      if (!fees || isNaN(fees) || Number(fees) < 0) e.fees = "Valid consultation fee required";
      if (!onlineFees || isNaN(onlineFees) || Number(onlineFees) < 0) e.onlineFees = "Valid online consultation fee required";
    }
    if (step === 4) {
      if (!bank.accountHolder.trim()) e.bankAccHolder = "Account holder name required";
      if (!bank.bankName.trim()) e.bankBankName = "Bank name required";
      if (!bank.accountNumber.trim()) e.bankAccNum = "Account number required";
      if (!bank.ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bank.ifsc.trim())) e.bankIfsc = "Valid IFSC code required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
  const prev = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

  const detectLocation = () => {
    setLocDetecting(true);
    fastDetectLocation((loc) => {
      if (loc) {
        if (loc.area) setArea(loc.area);
        if (loc.city) setCity(loc.city);
        if (loc.state) setState(loc.state);
        if (loc.pincode) setPincode(loc.pincode);
      }
      setLocDetecting(false);
    });
  };

  const handleFinish = () => {
    if (!validate()) return;
    onComplete({
      name, gender, dob, profilePhoto,
      idType, idNumber, idPhoto,
      councilName, regYear, regNumber, qualification, specialty, licenseDoc, regCertDoc,
      clinicName,
      area, city, state, pincode,
      location: `${area}, ${city}`,
      fullAddress: `${area}, ${city}, ${state} - ${pincode}`,
      fees: Number(fees),
      onlineFees: Number(onlineFees),
      availability: {
        availableDays,
        morning,
        evening,
        consultationTypes,
        slotDuration: Number(slotDuration),
        capacityPerSlot: Number(capacityPerSlot),
      },
      bank,
    });
  };

  return (
    <div className="border border-blue-100 bg-blue-50/30 rounded-2xl p-5 mt-3">
      <StepBar step={step} total={5} labels={STEPS} />

      {/* Step 0 – Personal */}
      {step === 0 && (
        <div className="space-y-3">
          <WizardSection emoji="👤" title="Personal Information" />
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaUserMd /></span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name (as per Medical Licence) *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.name} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Gender *</p>
            <div className="flex gap-2">
              {["Male", "Female", "Other"].map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition
                    ${gender === g ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  {g}
                </button>
              ))}
            </div>
            <Err msg={errors.gender} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Date of Birth *</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
            <Err msg={errors.dob} />
          </div>

          <PhotoUpload label="Profile Photo" required preview={profilePhoto}
            onFile={(b64) => setProfilePhoto(b64)} hint="JPG / PNG" />
          <Err msg={errors.profilePhoto} />
        </div>
      )}

      {/* Step 1 – Govt ID */}
      {step === 1 && (
        <div className="space-y-3">
          <WizardSection emoji="🪪" title="Government ID Proof" />
          <div className="flex gap-2">
            {[{ val: "aadhaar", label: "Aadhaar Card" }, { val: "pan", label: "PAN Card" }].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => { setIdType(val); setIdNumber(""); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition
                  ${idType === val ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaIdCard /></span>
              <input value={idNumber} onChange={e => setIdNumber(e.target.value)}
                placeholder={idType === "aadhaar" ? "12-digit Aadhaar Number *" : "PAN Card Number *"}
                maxLength={idType === "aadhaar" ? 12 : 10}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.idNumber} />
          </div>
          <PhotoUpload label={`${idType === "aadhaar" ? "Aadhaar" : "PAN"} Card Photo / Scan`} required
            preview={idPhoto} onFile={(b64) => setIdPhoto(b64)} accept="image/*,.pdf" hint="JPG/PNG/PDF" />
          <Err msg={errors.idPhoto} />
        </div>
      )}

      {/* Step 2 – Medical Council */}
      {step === 2 && (
        <div className="space-y-3">
          <WizardSection emoji="🏥" title="Medical Council & Qualifications" />
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><MdVerified /></span>
              <input value={councilName} onChange={e => setCouncilName(e.target.value)}
                placeholder="Medical Council Name (e.g. NMC, MCI, State Council) *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.councilName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={regYear} onChange={e => setRegYear(e.target.value)} type="number"
                placeholder="Year of Registration *" min="1950" max={new Date().getFullYear()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              <Err msg={errors.regYear} />
            </div>
            <div>
              <input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="Registration Number *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              <Err msg={errors.regNumber} />
            </div>
          </div>
          <div>
            <input value={qualification} onChange={e => setQualification(e.target.value)}
              placeholder="Highest Qualification (e.g. MBBS, MD, MS) *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
            <Err msg={errors.qualification} />
          </div>
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaStethoscope /></span>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white">
                <option value="">Select Specialty *</option>
                {["General Physician","Cardiologist","Dermatologist","Orthopedic Surgeon","Gynecologist",
                  "Pediatrician","Neurologist","ENT Specialist","Ophthalmologist","Psychiatrist",
                  "Dentist","Urologist","Oncologist","Endocrinologist","Rheumatologist"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <Err msg={errors.specialty} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PhotoUpload label="Medical License / Certificate" required preview={licenseDoc}
              onFile={(b64) => setLicenseDoc(b64)} accept="image/*,.pdf" hint="PDF or Image" />
            <PhotoUpload label="Registration Certificate (optional)" preview={regCertDoc}
              onFile={(b64) => setRegCertDoc(b64)} accept="image/*,.pdf" hint="PDF or Image" />
          </div>
          <Err msg={errors.licenseDoc} />
        </div>
      )}

      {/* Step 3 – Clinic */}
      {step === 3 && (
        <div className="space-y-3">
          <WizardSection emoji="🏨" title="Clinic Details" />
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaHospital /></span>
              <input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Clinic / Hospital Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.clinicName} />
          </div>
          <button type="button" onClick={detectLocation} disabled={locDetecting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition
              ${locDetecting ? "bg-blue-50 border-blue-200 text-blue-400 cursor-wait" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
            {locDetecting
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Detecting...</>
              : <><FaLocationArrow /> Auto-detect Address (GPS)</>}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={area} onChange={e => setArea(e.target.value)} placeholder="Area / Locality *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              <Err msg={errors.area} />
            </div>
            <div>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="City *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              <Err msg={errors.city} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={state} onChange={e => setState(e.target.value)} placeholder="State *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              <Err msg={errors.state} />
            </div>
            <div>
              <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode *" maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              <Err msg={errors.pincode} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaRupeeSign /></span>
                <input type="number" value={fees} onChange={e => setFees(e.target.value)}
                  placeholder="Physical Fee (₹) *" min="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              </div>
              <Err msg={errors.fees} />
            </div>
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaRupeeSign /></span>
                <input type="number" value={onlineFees} onChange={e => setOnlineFees(e.target.value)}
                  placeholder="Online Fee (₹) *" min="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white" />
              </div>
              <Err msg={errors.onlineFees} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Available Days *</p>
            <div className="flex flex-wrap gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <button key={day} type="button" 
                  onClick={() => setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition
                    ${availableDays.includes(day) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  {day.slice(0,3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <input type="checkbox" checked={morning.active} onChange={e => setMorning({...morning, active: e.target.checked})} /> Morning (9-12)
              </label>
              {morning.active && (
                <div className="flex items-center gap-2">
                  <input type="time" value={morning.start} onChange={e => setMorning({...morning, start: e.target.value})} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
                  <span className="text-gray-400 text-[10px]">to</span>
                  <input type="time" value={morning.end} onChange={e => setMorning({...morning, end: e.target.value})} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <input type="checkbox" checked={evening.active} onChange={e => setEvening({...evening, active: e.target.checked})} /> Evening (5-8)
              </label>
              {evening.active && (
                <div className="flex items-center gap-2">
                  <input type="time" value={evening.start} onChange={e => setEvening({...evening, start: e.target.value})} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
                  <span className="text-gray-400 text-[10px]">to</span>
                  <input type="time" value={evening.end} onChange={e => setEvening({...evening, end: e.target.value})} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Slot Duration</p>
              <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white">
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Patients / Slot</p>
              <input type="number" value={capacityPerSlot} onChange={e => setCapacityPerSlot(e.target.value)} min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Consultation Type</p>
            <div className="flex gap-2">
              {["physical", "video"].map(type => (
                <button key={type} type="button" 
                  onClick={() => setConsultationTypes(prev => prev.includes(type) ? (prev.length > 1 ? prev.filter(t => t !== type) : prev) : [...prev, type])}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition capitalize
                    ${consultationTypes.includes(type) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  {type === "physical" ? "Physical Visit" : "Video Consultation"}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Step 4 – Bank Details */}
      {step === 4 && (
        <div className="space-y-3">
          <BankDetailsBlock data={bank} onChange={setB}
            errors={{ accountHolder: errors.bankAccHolder, bankName: errors.bankBankName, accountNumber: errors.bankAccNum, ifsc: errors.bankIfsc }} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {step > 0 && (
          <button type="button" onClick={prev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            <FaChevronLeft /> Back
          </button>
        )}
        {step < 4 ? (
          <button type="button" onClick={next}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm">
            Next <FaChevronRight />
          </button>
        ) : (
          <button type="button" onClick={handleFinish}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm">
            <FaCheckCircle /> Submit KYC
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Role Card ── */
const RoleCard = ({ label, icon, active, onClick }) => (
  <div onClick={onClick}
    className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
      ${active ? "bg-green-50 border-green-500 text-green-700 shadow-sm scale-105" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
    <div className={`mb-1 ${active ? "text-green-600" : "text-gray-400"}`}>{icon}</div>
    <span className="text-xs font-medium text-center">{label}</span>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   MAIN SIGNUP COMPONENT
────────────────────────────────────────────────────────────── */
const Signup = () => {
  const { login, backendRegister } = useAuth();
  const { registerPartner } = useAppointment();
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [kycDone, setKycDone] = useState(false);
  const [kycData, setKycData] = useState(null);
  const [serverError, setServerError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch("password");

  const onKycComplete = (data) => { setKycData(data); setKycDone(true); };

  const onSubmit = async (data) => {
    setServerError("");
    try {
    const userData = {
      name: kycData?.name || data.name,
      phone: data.phone,
      email: data.email?.trim().toLowerCase(),
      password: data.password,
      role,
      ...(kycData || {}),
    };
    
      // Wait for backend registration to finish
      const res = await backendRegister(userData);
      
      // If doctor, save availability separately
      if (role === "doctor" && kycData?.availability) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";
        const docId = res?._id || res?.data?._id || res?.user?._id || res?.id;
        
        console.log("Saving availability for doctor:", docId);
        if (docId) {
          try {
            const availRes = await fetch(`${apiUrl}/doctor/availability`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                doctorId: docId,
                ...kycData.availability
              })
            });
            if (!availRes.ok) {
              const errData = await availRes.json().catch(() => ({}));
              console.error("Failed to save availability:", errData.message);
            } else {
              console.log("Availability saved successfully during signup");
            }
          } catch (availErr) {
            console.error("Error saving availability during signup:", availErr);
          }
        }
      }

      // (Optional) legacy partner registration if keeping both syncs for now
      if (role !== "user" && kycData) {
        registerPartner({
          ...userData,
          approved: false,
          registeredAt: new Date().toISOString(),
          rating: 5.0,
          availableSlots: ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"],
        });
      }

      if (role === "doctor") navigate("/doctor-dashboard");
      else if (role === "lab") navigate("/lab-dashboard");
      else if (role === "pharmacy") navigate("/pharmacy-dashboard");
      else if (role === "rider") navigate("/rider-dashboard");
      else navigate("/profile");
    } catch (error) {
      setServerError(error.message || "Registration failed. Please try again.");
    }
  };

  const handleSendOTP = async () => {
    let email = watch("email");
    if (!email) return toast.error("Please enter email first");
    email = email.trim().toLowerCase();
    
    setVerifyingEmail(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        toast.success("OTP sent to your email!");
        setShowOtpInput(true);
      } else {
        const json = await res.json();
        toast.error(json.message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Error sending OTP");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyOTP = async () => {
    let email = watch("email");
    if (!email || !otpValue) return toast.error("Enter email and OTP");
    email = email.trim().toLowerCase();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue })
      });
      if (res.ok) {
        toast.success("Email verified!");
        setEmailVerified(true);
        setShowOtpInput(false);
      } else {
        toast.error("Invalid or expired OTP");
      }
    } catch (err) {
      toast.error("Verification failed");
    }
  };

  const canSubmit = (role === "user" || role === "rider" || kycDone) && emailVerified;

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 relative overflow-hidden py-6 sm:py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-green-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 mx-4 sm:mx-0">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="D2D Pharma Logo" className="w-16 h-16 mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">D2D Pharma</h1>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">Create Your Account</h2>
          <p className="text-sm text-gray-500">Join D2D Pharma Today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Role Selection */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Select Your Role:</p>
            <div className="grid grid-cols-5 gap-2">
              <RoleCard label="User"     icon={<FaUser className="text-xl" />}                   active={role==="user"}     onClick={() => { setRole("user"); setKycDone(false); setKycData(null); }} />
              <RoleCard label="Doctor"   icon={<FaUserMd className="text-xl" />}                 active={role==="doctor"}   onClick={() => { setRole("doctor"); setKycDone(false); setKycData(null); }} />
              <RoleCard label="Pharmacy" icon={<FaPrescriptionBottleAlt className="text-xl" />}  active={role==="pharmacy"} onClick={() => { setRole("pharmacy"); setKycDone(false); setKycData(null); }} />
              <RoleCard label="Lab"      icon={<FaVial className="text-xl" />}                   active={role==="lab"}      onClick={() => { setRole("lab"); setKycDone(false); setKycData(null); }} />
              <RoleCard label="Rider"    icon={<span className="text-xl">🛵</span>}               active={role==="rider"}    onClick={() => { setRole("rider"); setKycDone(false); setKycData(null); }} />
            </div>
          </div>

          {/* Full Name — only for User and Rider role */}
          {(role === "user" || role === "rider") && (
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaUser /></span>
                <input type="text" placeholder="Full Name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 text-gray-700 bg-gray-50/50 ${errors.name ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-500"}`}
                  {...register("name", { required: "Full name is required", minLength: { value: 2, message: "Min 2 chars" } })} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
          )}

          {/* Phone */}
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><MdPhone className="text-xl" /></span>
              <input type="tel" placeholder="Mobile Number"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 text-gray-700 bg-gray-50/50 ${errors.phone ? "border-red-400" : "border-gray-300 focus:ring-green-500"}`}
                {...register("phone", { required: "Mobile required", pattern: { value: /^[6-9]\d{9}$/, message: "Enter valid 10-digit number" } })} />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><MdEmail className="text-xl" /></span>
                <input type="email" placeholder="Email Address" disabled={emailVerified}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 text-gray-700 bg-gray-50/50 ${errors.email ? "border-red-400" : "border-gray-300 focus:ring-green-500"}`}
                  {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter valid email" } })} />
              </div>
              {!emailVerified && !showOtpInput && (
                <button type="button" onClick={handleSendOTP} disabled={verifyingEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-3 rounded-lg transition disabled:opacity-50">
                  {verifyingEmail ? "..." : "Verify"}
                </button>
              )}
              {!emailVerified && showOtpInput && (
                <button type="button" onClick={handleSendOTP} disabled={verifyingEmail}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold px-4 py-3 rounded-lg transition disabled:opacity-50">
                  {verifyingEmail ? "..." : "Resend"}
                </button>
              )}
              {emailVerified && <span className="text-green-600 font-bold text-xs bg-green-50 px-3 py-3 rounded-lg border border-green-200">Verified ✓</span>}
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            
            {showOtpInput && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <input type="text" placeholder="Enter 6-digit OTP" maxLength={6}
                  value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g,''))}
                  className="flex-1 px-4 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50 outline-none focus:ring-2 focus:ring-blue-400" />
                <button type="button" onClick={handleVerifyOTP}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">
                  Confirm
                </button>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaLock /></span>
              <input type="password" placeholder="Password"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 text-gray-700 bg-gray-50/50 ${errors.password ? "border-red-400" : "border-gray-300 focus:ring-green-500"}`}
                {...register("password", { required: "Password required", minLength: { value: 6, message: "Min 6 characters" }, pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: "Must have letter + number" } })} />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaLock /></span>
              <input type="password" placeholder="Confirm Password"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 text-gray-700 bg-gray-50/50 ${errors.confirmPassword ? "border-red-400" : "border-gray-300 focus:ring-green-500"}`}
                {...register("confirmPassword", { required: "Please confirm password", validate: v => v === password || "Passwords do not match" })} />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* ── KYC WIZARDS ── */}
          {role === "doctor" && !kycDone && <DoctorKYCWizard onComplete={onKycComplete} />}
          {role === "lab" && !kycDone && <LabKYCWizard onComplete={onKycComplete} />}
          {role === "pharmacy" && !kycDone && <PharmacyKYCWizard onComplete={onKycComplete} />}

          {/* KYC Done badge */}
          {role !== "user" && kycDone && kycData && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <FaCheckCircle className="text-green-600 text-xl flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-700">KYC Details Submitted ✓</p>
                <p className="text-xs text-green-600">{kycData.name} · {kycData.clinicName || kycData.labName || kycData.storeName}</p>
              </div>
              <button type="button" onClick={() => setKycDone(false)}
                className="ml-auto text-xs text-blue-600 underline hover:no-underline">Edit</button>
            </div>
          )}

          <button type="submit" disabled={isSubmitting || !canSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-md transition-all transform active:scale-95 mt-6 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting && <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
          
          {serverError && <p className="text-center text-sm text-red-600 font-semibold mt-2">{serverError}</p>}
          
          {role !== "user" && role !== "rider" && !kycDone && (
            <p className="text-center text-xs text-gray-400 mt-2">Complete the KYC steps above before signing up.</p>
          )}
        </form>

        <div className="mt-6">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-4 text-gray-500 text-sm">Or Sign Up with</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <div className="space-y-3 mt-4">
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm">
              <FaGoogle className="text-red-500 text-xl" /> Sign Up with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white py-2.5 rounded-lg hover:bg-[#166fe5] transition font-medium shadow-sm">
              <FaFacebook className="text-white text-xl" /> Sign Up with Facebook
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login Here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
