import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { FaVideo, FaPhoneSlash } from "react-icons/fa";

const IncomingCallOverlay = () => {
  const { user } = useAuth();
  const { fetchPatientAppointments } = useAppointment();
  const [incomingCall, setIncomingCall] = useState(null);
  const [dismissedCalls, setDismissedCalls] = useState(new Set());

  useEffect(() => {
    if (!user || !user.email) return;

    let intervalId;

    const checkCalls = async () => {
      try {
        const appts = await fetchPatientAppointments(user.email);
        const activeCall = appts.find(a => 
            a.meetingActive === true && 
            a.consultationType === "video" && 
            !dismissedCalls.has(a._id || a.id)
        );
        
        if (activeCall) {
          setIncomingCall(activeCall);
        } else {
          setIncomingCall(null);
        }
      } catch (err) {
        console.error("Failed to fetch active calls", err);
      }
    };

    checkCalls();
    intervalId = setInterval(checkCalls, 5000);

    return () => clearInterval(intervalId);
  }, [user, fetchPatientAppointments, dismissedCalls]);

  if (!incomingCall) return null;

  const handleDismiss = () => {
    setDismissedCalls(prev => new Set(prev).add(incomingCall._id || incomingCall.id));
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 animate-pulse" />
        
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-100 relative">
             <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
            <FaVideo className="text-4xl text-blue-600 relative z-10" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-800 mb-1">Incoming Video Call</h2>
          <p className="text-gray-500 font-bold mb-1">
            Dr. {incomingCall.partnerName || "Your Doctor"}
          </p>
          <p className="text-xs text-gray-400 mb-8 border border-gray-100 bg-gray-50 px-3 py-1.5 rounded-full inline-block">
            {incomingCall.appointmentDate} at {incomingCall.appointmentTime}
          </p>
          
          <div className="flex gap-4 w-full">
            <button 
              onClick={handleDismiss}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
            >
               <FaPhoneSlash className="text-xl" />
               <span className="text-[10px] uppercase tracking-widest">Decline</span>
            </button>
            <a 
              href={incomingCall.meetingLink}
              target="_blank"
              rel="noreferrer"
              onClick={handleDismiss}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-1.5 shadow-lg shadow-green-200 transition active:scale-95 text-decoration-none"
            >
               <FaVideo className="text-xl animate-pulse" />
               <span className="text-[10px] uppercase tracking-widest">Accept Call</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallOverlay;
