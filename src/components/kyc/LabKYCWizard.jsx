import { useState } from "react";
import { useLocation } from "../../context/LocationContext";
import {
  FaUser, FaIdCard, FaVial, FaUniversity, FaPercent,
  FaChevronRight, FaChevronLeft, FaCheckCircle,
  FaLocationArrow, FaMapMarkerAlt, FaSignOutAlt
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import {
  StepBar, PhotoUpload, WizardSection, KInput, Err, BankDetailsBlock, toBase64
} from "./KYCShared";

const QUALIFICATIONS = [
  "DMLT (Diploma in MLT)", "BMLT (Bachelor in MLT)", "BSc MLT",
  "MSc MLT", "B.Sc Biochemistry", "M.Sc Biochemistry",
  "PGDMLT", "PhD in MLT", "Other"
];

const LabKYCWizard = ({ onComplete }) => {
  const { nearestArea, getGeoAddress, fastDetectLocation } = useLocation();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Step 0 — Personal
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState(null);

  // Step 1 — Qualification
  const [qualification, setQualification] = useState("");
  const [institute, setInstitute] = useState("");
  const [yearOfPassing, setYearOfPassing] = useState("");
  const [qualCert, setQualCert] = useState(null);

  // Step 2 — Lab Details
  const [labName, setLabName] = useState("");
  const [labRegNumber, setLabRegNumber] = useState("");
  const [regAuthority, setRegAuthority] = useState("state");
  const [labArea, setLabArea] = useState("");
  const [labCity, setLabCity] = useState("");
  const [labState, setLabState] = useState("");
  const [labPincode, setLabPincode] = useState("");
  const [nablCert, setNablCert] = useState("no");
  const [services, setServices] = useState("");
  const [locDetecting, setLocDetecting] = useState(false);

  // Bank
  const [bank, setBank] = useState({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", cancelledCheque: null });
  const setB = (k, v) => setBank(prev => ({ ...prev, [k]: v }));

  const STEPS = ["Personal", "Qualification", "Lab & Bank"];

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!name.trim()) e.name = "Name is required";
      if (!profilePhoto) e.profilePhoto = "Profile photo required";
      if (!dob) e.dob = "Date of birth required";
      if (!gender) e.gender = "Select gender";
      if (!idNumber.trim()) e.idNumber = "ID number required";
      if (idType === "aadhaar" && !/^\d{12}$/.test(idNumber.trim())) e.idNumber = "Aadhaar must be 12 digits";
      if (idType === "pan" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(idNumber.trim())) e.idNumber = "Invalid PAN format";
      if (!idPhoto) e.idPhoto = "ID proof photo required";
    }
    if (step === 1) {
      if (!qualification) e.qualification = "Select qualification";
      if (!institute.trim()) e.institute = "Institute name required";
      if (!yearOfPassing || isNaN(yearOfPassing) || yearOfPassing < 1970 || yearOfPassing > new Date().getFullYear()) e.yearOfPassing = "Valid year required";
      if (!qualCert) e.qualCert = "Certificate upload required";
    }
    if (step === 2) {
      if (!labName.trim()) e.labName = "Lab name required";
      if (!labRegNumber.trim()) e.labRegNumber = "Lab registration number required";
      if (!labArea.trim()) e.labArea = "Area required";
      if (!labCity.trim()) e.labCity = "City required";
      if (!labState.trim()) e.labState = "State required";
      if (!labPincode.trim() || !/^\d{6}$/.test(labPincode.trim())) e.labPincode = "Valid 6-digit pincode required";
      if (!bank.accountHolder.trim()) e.bankAccHolder = "Account holder name required";
      if (!bank.bankName.trim()) e.bankName = "Bank name required";
      if (!bank.accountNumber.trim()) e.bankAccNum = "Account number required";
      if (!bank.ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bank.ifsc.trim())) e.bankIfsc = "Valid IFSC code required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 2)); };
  const prev = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

  const detectLocation = () => {
    setLocDetecting(true);
    fastDetectLocation((loc) => {
      if (loc) {
        if (loc.area) setLabArea(loc.area);
        if (loc.city) setLabCity(loc.city);
        if (loc.state) setLabState(loc.state);
        if (loc.pincode) setLabPincode(loc.pincode);
      }
      setLocDetecting(false);
    });
  };

  const handleFinish = () => {
    if (!validate()) return;
    onComplete({
      name, profilePhoto, dob, gender, idType, idNumber, idPhoto,
      qualification, institute, yearOfPassing, qualCert,
      labName, labRegNumber, regAuthority,
      labArea, labCity, labState, labPincode,
      location: `${labArea}, ${labCity}`,
      fullAddress: `${labArea}, ${labCity}, ${labState} - ${labPincode}`,
      clinicName: labName,
      nablCert, services,
      bank,
    });
  };

  return (
    <div className="border border-cyan-100 bg-cyan-50/30 rounded-2xl p-5 mt-3">
      <StepBar step={step} total={3} labels={STEPS} />

      {/* ── Step 0: Personal ── */}
      {step === 0 && (
        <div className="space-y-3">
          <WizardSection emoji="👤" title="Personal Information" />
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaUser /></span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.name} />
          </div>

          <PhotoUpload label="Profile Photo" required preview={profilePhoto}
            onFile={(b64) => setProfilePhoto(b64)} hint="JPG / PNG" />
          <Err msg={errors.profilePhoto} />

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Date of Birth *</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)}
              max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
            <Err msg={errors.dob} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Gender *</p>
            <div className="flex gap-2">
              {["Male", "Female", "Other"].map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition
                    ${gender === g ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-600 border-gray-300 hover:border-cyan-400"}`}>
                  {g}
                </button>
              ))}
            </div>
            <Err msg={errors.gender} />
          </div>

          <div className="flex gap-2 mt-1">
            {[{ val: "aadhaar", label: "Aadhaar" }, { val: "pan", label: "PAN Card" }].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => { setIdType(val); setIdNumber(""); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition
                  ${idType === val ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-600 border-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaIdCard /></span>
              <input value={idNumber} onChange={e => setIdNumber(e.target.value)}
                placeholder={idType === "aadhaar" ? "12-digit Aadhaar Number *" : "PAN Number (e.g. ABCDE1234F) *"}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white"
                maxLength={idType === "aadhaar" ? 12 : 10} />
            </div>
            <Err msg={errors.idNumber} />
          </div>

          <PhotoUpload label={`${idType === "aadhaar" ? "Aadhaar" : "PAN"} Card Photo / Scan`} required
            preview={idPhoto} onFile={(b64) => setIdPhoto(b64)} accept="image/*,.pdf" hint="JPG/PNG/PDF" />
          <Err msg={errors.idPhoto} />
        </div>
      )}

      {/* ── Step 1: Qualification ── */}
      {step === 1 && (
        <div className="space-y-3">
          <WizardSection emoji="🎓" title="Qualification & Certification" />
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><MdVerified /></span>
              <select value={qualification} onChange={e => setQualification(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white">
                <option value="">Select Qualification *</option>
                {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <Err msg={errors.qualification} />
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaUniversity /></span>
              <input value={institute} onChange={e => setInstitute(e.target.value)}
                placeholder="Institute / College Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.institute} />
          </div>

          <div>
            <input type="number" value={yearOfPassing} onChange={e => setYearOfPassing(e.target.value)}
              placeholder="Year of Passing *" min="1970" max={new Date().getFullYear()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
            <Err msg={errors.yearOfPassing} />
          </div>

          <PhotoUpload label="Qualification Certificate" required preview={qualCert}
            onFile={(b64) => setQualCert(b64)} accept="image/*,.pdf" hint="PDF or Image" />
          <Err msg={errors.qualCert} />
        </div>
      )}

      {/* ── Step 2: Lab Details + Bank ── */}
      {step === 2 && (
        <div className="space-y-3">
          <WizardSection emoji="🧪" title="Lab Details" />

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaVial /></span>
              <input value={labName} onChange={e => setLabName(e.target.value)}
                placeholder="Lab / Diagnostic Centre Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.labName} />
          </div>

          <div>
            <input value={labRegNumber} onChange={e => setLabRegNumber(e.target.value)}
              placeholder="Lab Registration Number *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
            <Err msg={errors.labRegNumber} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Registering Authority *</p>
            <div className="flex gap-2">
              {[{ val: "state", label: "State Government" }, { val: "private", label: "Private Body" }].map(({ val, label }) => (
                <button key={val} type="button" onClick={() => setRegAuthority(val)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition
                    ${regAuthority === val ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* GPS */}
          <button type="button" onClick={detectLocation} disabled={locDetecting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition
              ${locDetecting ? "bg-cyan-50 border-cyan-200 text-cyan-400 cursor-wait" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}>
            {locDetecting
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Detecting...</>
              : <><FaLocationArrow /> Auto-detect Lab Address (GPS)</>}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={labArea} onChange={e => setLabArea(e.target.value)} placeholder="Area / Locality *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
              <Err msg={errors.labArea} />
            </div>
            <div>
              <input value={labCity} onChange={e => setLabCity(e.target.value)} placeholder="City *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
              <Err msg={errors.labCity} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={labState} onChange={e => setLabState(e.target.value)} placeholder="State *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
              <Err msg={errors.labState} />
            </div>
            <div>
              <input value={labPincode} onChange={e => setLabPincode(e.target.value)} placeholder="Pincode *" maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
              <Err msg={errors.labPincode} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">NABL Accreditation</p>
            <div className="flex gap-2">
              {[{ val: "yes", label: "Yes — NABL Accredited" }, { val: "no", label: "No" }].map(({ val, label }) => (
                <button key={val} type="button" onClick={() => setNablCert(val)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition
                    ${nablCert === val ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-600 border-gray-300"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <input value={services} onChange={e => setServices(e.target.value)}
              placeholder="Services Offered (optional, comma-separated)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-gray-700 bg-white" />
          </div>

          <div className="border-t border-gray-200 pt-3">
            <BankDetailsBlock data={bank} onChange={setB}
              errors={{ accountHolder: errors.bankAccHolder, bankName: errors.bankName, accountNumber: errors.bankAccNum, ifsc: errors.bankIfsc }} />
          </div>
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
        {step < 2 ? (
          <button type="button" onClick={next}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm">
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

export default LabKYCWizard;
