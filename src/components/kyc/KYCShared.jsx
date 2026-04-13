/* ── Shared KYC Utilities ──
   Used by DoctorKYCWizard, LabKYCWizard, PharmacyKYCWizard
*/

import { useRef } from "react";
import { FaCamera, FaCheckCircle, FaUpload, FaFilePdf } from "react-icons/fa";

/* Convert file → base64 */
export const toBase64 = (file) => new Promise((res, rej) => {
  if (!file) return res(null);
  const reader = new FileReader();
  reader.onload = (e) => res(e.target.result);
  reader.onerror = rej;
  reader.readAsDataURL(file);
});

/* ── Step Progress Bar ── */
export const StepBar = ({ step, total, labels }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-2">
      {labels.map((l, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition
            ${i < step ? "bg-blue-600 border-blue-600 text-white" : i === step ? "bg-white border-blue-600 text-blue-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}>
            {i < step ? <FaCheckCircle className="text-sm" /> : i + 1}
          </div>
          <p className={`text-[9px] mt-1 font-semibold text-center ${i <= step ? "text-blue-600" : "text-gray-400"}`}>{l}</p>
        </div>
      ))}
    </div>
    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-blue-600 transition-all rounded-full" style={{ width: `${(step / (total - 1)) * 100}%` }} />
    </div>
  </div>
);

/* ── Photo / Document Upload Box ── */
export const PhotoUpload = ({ label, preview, onFile, accept = "image/*", hint, required }) => {
  const ref = useRef();
  const isPdf = preview && (preview.startsWith("data:application") || preview.includes("application/pdf"));
  return (
    <div>
      {label && <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}{required && " *"}</p>}
      <div
        onClick={() => ref.current.click()}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition flex items-center justify-center overflow-hidden
          ${preview ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 bg-gray-50"}`}
        style={{ minHeight: 90 }}
      >
        {preview ? (
          isPdf ? (
            <div className="flex flex-col items-center py-4 text-blue-700">
              <FaFilePdf className="text-2xl mb-1" />
              <p className="text-xs font-semibold">PDF Uploaded ✓</p>
            </div>
          ) : (
            <img src={preview} alt="preview" className="max-h-28 object-contain rounded-lg p-1" />
          )
        ) : (
          <div className="flex flex-col items-center py-4 text-gray-400">
            <FaCamera className="text-xl mb-1" />
            <p className="text-xs">Click to upload</p>
            {hint && <p className="text-[10px] mt-0.5 text-gray-400">{hint}</p>}
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={async (e) => {
          const f = e.target.files[0];
          if (f) onFile(await toBase64(f), f.name);
        }} />
    </div>
  );
};

/* ── Section Header inside wizard ── */
export const WizardSection = ({ emoji, title }) => (
  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">{emoji} {title}</p>
);

/* ── Inline text input ── */
export const KInput = ({ value, onChange, placeholder, type = "text", maxLength, min, max, children, className = "" }) => (
  children ?? (
    <input value={value} onChange={e => onChange(e.target.value)}
      type={type} placeholder={placeholder} maxLength={maxLength} min={min} max={max}
      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white ${className}`} />
  )
);

/* ── Inline error text ── */
export const Err = ({ msg }) => msg ? <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p> : null;

/* ── Bank Details Block (reusable across all 3 wizards) ── */
export const BankDetailsBlock = ({ data, onChange, errors }) => (
  <div className="space-y-3">
    <WizardSection emoji="🏦" title="Bank Details" />
    <div>
      <KInput value={data.accountHolder} onChange={v => onChange("accountHolder", v)} placeholder="Account Holder Name *" />
      <Err msg={errors?.accountHolder} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <KInput value={data.bankName} onChange={v => onChange("bankName", v)} placeholder="Bank Name *" />
        <Err msg={errors?.bankName} />
      </div>
      <div>
        <KInput value={data.ifsc} onChange={v => onChange("ifsc", v.toUpperCase())} placeholder="IFSC Code *" maxLength={11} />
        <Err msg={errors?.ifsc} />
      </div>
    </div>
    <div>
      <KInput value={data.accountNumber} onChange={v => onChange("accountNumber", v)} placeholder="Account Number *" type="text" />
      <Err msg={errors?.accountNumber} />
    </div>
    <PhotoUpload label="Cancelled Cheque" preview={data.cancelledCheque}
      onFile={(b64) => onChange("cancelledCheque", b64)} accept="image/*,.pdf" hint="JPG/PNG/PDF" />
  </div>
);
