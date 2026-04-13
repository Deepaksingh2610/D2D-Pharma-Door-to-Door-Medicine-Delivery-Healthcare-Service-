import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [medicines, setMedicines]       = useState([]);
  const [labTests, setLabTests]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports]           = useState([]);
  const [orders, setOrders]             = useState([]);
  const [complaints, setComplaints]     = useState([]);

  // ─────────────────────────────────────────────
  // APPOINTMENTS
  // ─────────────────────────────────────────────
  const bookAppointment = useCallback(async (apptData) => {
    try {
      const res = await fetch(`${API}/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apptData),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Booking failed (${res.status})`);
      }
      const json = await res.json();
      const newAppt = json.data;
      setAppointments((prev) => [newAppt, ...prev]);
      return newAppt;
    } catch (err) {
      console.error("bookAppointment:", err);
      throw err;
    }
  }, []);

  const getPartnerAppointments = useCallback(
    (email) => appointments.filter((a) => a.partnerEmail === email),
    [appointments]
  );
  const getUserAppointments = useCallback(
    (email) => appointments.filter((a) => a.patientEmail === email),
    [appointments]
  );

  const fetchPartnerAppointments = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/appointments/partner/${encodeURIComponent(email)}`);
      if (!res.ok) return [];
      const json = await res.json();
      setAppointments((prev) => {
        const others = prev.filter((a) => a.partnerEmail !== email);
        return [...json.data, ...others];
      });
      return json.data;
    } catch (err) { console.error("fetchPartnerAppointments:", err); }
    return [];
  }, []);

  const fetchPatientAppointments = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/appointments/patient/${encodeURIComponent(email)}`);
      if (!res.ok) return [];
      const json = await res.json();
      setAppointments((prev) => {
        const others = prev.filter((a) => a.patientEmail !== email);
        return [...json.data, ...others];
      });
      return json.data;
    } catch (err) { console.error("fetchPatientAppointments:", err); }
    return [];
  }, []);

  const updateAppointmentStatus = useCallback(async (id, status) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAppointments((prev) => prev.map((a) => (a._id === id || a.id === id) ? { ...a, status } : a));
      return json.data;
    } catch (err) { console.error("updateAppointmentStatus:", err); throw err; }
  }, []);

  const markOrderDispatched = useCallback(async (appointmentId) => {
    try {
      const res = await fetch(`${API}/appointments/${appointmentId}/dispatch`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAppointments((prev) => prev.map((a) =>
        (a._id === appointmentId || a.id === appointmentId) ? { ...a, dispatched: true } : a
      ));
    } catch (err) { console.error("markOrderDispatched:", err); }
  }, []);

  const markSampleCollected = useCallback(async (appointmentId) => {
    try {
      const res = await fetch(`${API}/appointments/${appointmentId}/sample`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAppointments((prev) => prev.map((a) =>
        (a._id === appointmentId || a.id === appointmentId) ? { ...a, sampleCollected: true } : a
      ));
    } catch (err) { console.error("markSampleCollected:", err); }
  }, []);

  const startVideoCall = useCallback(async (id) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/video/start`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAppointments((prev) => prev.map((a) => (a._id === id || a.id === id) ? json.data : a));
      return json.data;
    } catch (err) { console.error("startVideoCall:", err); throw err; }
  }, []);

  const endVideoCall = useCallback(async (id) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/video/end`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAppointments((prev) => prev.map((a) => (a._id === id || a.id === id) ? json.data : a));
      return json.data;
    } catch (err) { console.error("endVideoCall:", err); throw err; }
  }, []);

  const uploadPrescription = useCallback(async (id, prescriptionData) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/prescription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prescriptionData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setAppointments((prev) => prev.map((a) => (a._id === id || a.id === id) ? json.data : a));
      return json.data;
    } catch (err) { console.error("uploadPrescription:", err); throw err; }
  }, []);

  // ─────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────
  const uploadReport = useCallback(async (appointmentId, fileData, fileName) => {
    try {
      const res = await fetch(`${API}/appointments/report/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, fileData, fileName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setReports((prev) => [json.data, ...prev]);
      setAppointments((prev) => prev.map((a) =>
        (a._id === appointmentId || a.id === appointmentId) ? { ...a, reportUploaded: true } : a
      ));
      return json.data;
    } catch (err) { console.error("uploadReport:", err); throw err; }
  }, []);

  const getReportsByUser = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/appointments/report/patient/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) { setReports(json.data); return json.data; }
    } catch (err) { console.error("getReportsByUser:", err); }
    return reports.filter((r) => r.patientEmail === email);
  }, [reports]);

  const getReportByAppointment = (appointmentId) =>
    reports.find((r) => r.appointmentId === appointmentId || r.appointmentId === appointmentId?.toString());

  // ─────────────────────────────────────────────
  // MEDICINES
  // ─────────────────────────────────────────────
  const addMedicine = useCallback(async (data) => {
    try {
      const res = await fetch(`${API}/medicines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      const m = json.data;
      setMedicines((prev) => [m, ...prev]);
      return m;
    } catch (err) { console.error("addMedicine:", err); throw err; }
  }, []);

  const bulkAddMedicines = useCallback(async (data) => {
    try {
      const res = await fetch(`${API}/medicines/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      const newMeds = json.data;
      setMedicines((prev) => [...newMeds, ...prev]);
      return newMeds;
    } catch (err) { console.error("bulkAddMedicines:", err); throw err; }
  }, []);

  const deleteMedicine = useCallback(async (id) => {
    try {
      await fetch(`${API}/medicines/${id}`, { method: "DELETE" });
      setMedicines((prev) => prev.filter((m) => m._id !== id && m.id !== id));
    } catch (err) { console.error("deleteMedicine:", err); }
  }, []);

  const getMedicinesByStore = useCallback(
    (email) => medicines.filter((m) => m.storeEmail === email),
    [medicines]
  );

  const fetchMedicinesByStore = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/medicines/store/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) {
        setMedicines((prev) => {
          const others = prev.filter((m) => m.storeEmail !== email);
          return [...json.data, ...others];
        });
        return json.data;
      }
    } catch (err) { console.error("fetchMedicinesByStore:", err); }
    return [];
  }, []);

  const fetchAllMedicines = useCallback(async () => {
    try {
      const res = await fetch(`${API}/medicines/all`);
      const json = await res.json();
      if (res.ok) { setMedicines(json.data); return json.data; }
    } catch (err) { console.error("fetchAllMedicines:", err); }
    return [];
  }, []);

  // ─────────────────────────────────────────────
  // LAB TESTS
  // ─────────────────────────────────────────────
  const addLabTest = useCallback(async (data) => {
    try {
      const res = await fetch(`${API}/labtests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      const t = json.data;
      setLabTests((prev) => [t, ...prev]);
      return t;
    } catch (err) { console.error("addLabTest:", err); throw err; }
  }, []);

  const bulkAddLabTests = useCallback(async (data) => {
    try {
      const res = await fetch(`${API}/labtests/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setLabTests((prev) => [...json.data, ...prev]);
      return json.data;
    } catch (err) { console.error("bulkAddLabTests:", err); throw err; }
  }, []);

  const deleteLabTest = useCallback(async (id) => {
    try {
      await fetch(`${API}/labtests/${id}`, { method: "DELETE" });
      setLabTests((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    } catch (err) { console.error("deleteLabTest:", err); }
  }, []);

  const getLabTestsByLab = useCallback(
    (email) => labTests.filter((t) => t.labEmail === email),
    [labTests]
  );

  const fetchLabTestsByLab = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/labtests/lab/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) {
        setLabTests((prev) => {
          const others = prev.filter((t) => t.labEmail !== email);
          return [...json.data, ...others];
        });
        return json.data;
      }
    } catch (err) { console.error("fetchLabTestsByLab:", err); }
    return [];
  }, []);

  const fetchAllLabTests = useCallback(async () => {
    try {
      const res = await fetch(`${API}/labtests/all`);
      const json = await res.json();
      if (res.ok) { setLabTests(json.data); return json.data; }
    } catch (err) { console.error("fetchAllLabTests:", err); }
    return [];
  }, []);

  // ─────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────
  const getNotificationsByUser = useCallback(
    (email) => notifications.filter((n) => n.targetEmail === email),
    [notifications]
  );

  const fetchNotifications = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/notifications/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) { setNotifications(json.data); return json.data; }
    } catch (err) { console.error("fetchNotifications:", err); }
    return [];
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n._id === id || n.id === id) ? { ...n, read: true } : n));
    } catch (err) { console.error("markNotificationRead:", err); }
  }, []);

  const markAllNotificationsRead = useCallback(async (email) => {
    try {
      await fetch(`${API}/notifications/readall/${encodeURIComponent(email)}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) =>
        (n.targetEmail === email || n.patientEmail === email) ? { ...n, read: true } : n
      ));
    } catch (err) { console.error("markAllNotificationsRead:", err); }
  }, []);

  const sendNotification = useCallback(async (targetEmail, message, type = "general") => {
    try {
      await fetch(`${API}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, message, type, patientEmail: targetEmail }),
      });
    } catch (err) { console.error("sendNotification:", err); }
  }, []);

  // ─────────────────────────────────────────────
  // PARTNERS
  // ─────────────────────────────────────────────
  const registerPartner = useCallback(async (partnerData) => {
    // Called from dashboard profile update
    try {
      const { email, role, ...updates } = partnerData;
      if (!email || !role) return;
      await fetch(`${API}/partners/${role}/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) { console.error("registerPartner:", err); }
  }, []);

  const getPartnersByRole = useCallback(async (role) => {
    try {
      const res = await fetch(`${API}/partners/role/${role}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) { console.error("getPartnersByRole:", err); }
    return [];
  }, []);

  // ─────────────────────────────────────────────
  // COMPLAINTS
  // ─────────────────────────────────────────────
  const submitComplaint = useCallback(async (data) => {
    try {
      const res = await fetch(`${API}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setComplaints((prev) => [json.data, ...prev]);
      return json.data;
    } catch (err) { console.error("submitComplaint:", err); throw err; }
  }, []);

  const fetchAllComplaints = useCallback(async () => {
    try {
      const res = await fetch(`${API}/complaints/all`);
      if (!res.ok) return [];
      const json = await res.json();
      setComplaints(json.data || []);
      return json.data || [];
    } catch (err) { console.error("fetchAllComplaints:", err); }
    return [];
  }, []);

  const updateComplaintStatus = useCallback(async (id, updates) => {
    try {
      const res = await fetch(`${API}/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setComplaints((prev) => prev.map((c) => (c._id === id || c.id === id) ? json.data : c));
    } catch (err) { console.error("updateComplaintStatus:", err); }
  }, []);

  const placeOrder = useCallback(async (data) => {
    try {
      const res = await fetch(`${API}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setOrders(prev => [json.data, ...prev]);
      return json.data;
    } catch (err) { console.error("placeOrder:", err); throw err; }
  }, []);

  const fetchPatientOrders = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/orders/patient/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) {
        setOrders(prev => {
          const others = prev.filter(o => o.patientEmail !== email);
          return [...json.data, ...others];
        });
        return json.data;
      }
    } catch (err) { console.error("fetchPatientOrders:", err); }
    return [];
  }, []);

  const fetchStoreOrders = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/orders/store/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) {
        setOrders(prev => {
          const others = prev.filter(o => o.storeEmail !== email);
          return [...json.data, ...others];
        });
        return json.data;
      }
    } catch (err) { console.error("fetchStoreOrders:", err); }
    return [];
  }, []);

  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const res = await fetch(`${API}/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setOrders(prev => prev.map(o => (o._id === id || o.id === id) ? { ...o, status } : o));
      return json.data;
    } catch (err) { console.error("updateOrderStatus:", err); throw err; }
  }, []);

  // ─────────────────────────────────────────────
  // RIDER LOGIC
  // ─────────────────────────────────────────────
  const fetchAvailableRiderOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/riders/available`);
      const json = await res.json();
      if (res.ok) return json.data;
    } catch (err) { console.error("fetchAvailableRiderOrders:", err); }
    return [];
  }, []);

  const fetchMyDeliveries = useCallback(async (email) => {
    try {
      const res = await fetch(`${API}/riders/my-deliveries/${encodeURIComponent(email)}`);
      const json = await res.json();
      if (res.ok) return json.data;
    } catch (err) { console.error("fetchMyDeliveries:", err); }
    return [];
  }, []);

  const acceptDelivery = useCallback(async (id, riderData) => {
    try {
      const res = await fetch(`${API}/riders/${id}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(riderData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      // Update local state if it's currently loaded
      setOrders(prev => prev.map(o => (o._id === id || o.id === id) ? json.data : o));
      return json.data;
    } catch (err) { console.error("acceptDelivery:", err); throw err; }
  }, []);

  const completeDelivery = useCallback(async (id, deliveryOTP) => {
    try {
      const res = await fetch(`${API}/riders/${id}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryOTP }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setOrders(prev => prev.map(o => (o._id === id || o.id === id) ? json.data : o));
      return json.data;
    } catch (err) { console.error("completeDelivery:", err); throw err; }
  }, []);

  // Lab Availability & Slots
  const fetchLabAvailability = async (email) => {
    try {
      const res = await fetch(`${API}/lab-availability/me?email=${email}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error("fetchLabAvailability error:", err);
      return null;
    }
  };

  const saveLabAvailability = async (data) => {
    try {
      const res = await fetch(`${API}/lab-availability/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      console.error("saveLabAvailability error:", err);
      return { success: false, message: err.message };
    }
  };

  const fetchLabSlots = async (email, date) => {
    try {
      const res = await fetch(`${API}/appointments/slots?partnerEmail=${encodeURIComponent(email)}&partnerRole=lab&date=${date}`);
      const json = await res.json();
      return { slots: json.success ? json.data : [], message: json.message };
    } catch (err) {
      console.error("fetchLabSlots error:", err);
      return { slots: [], message: "Failed to connect to slot server." };
    }
  };
  return (
    <AppointmentContext.Provider value={{
      // State
      appointments, medicines, labTests, notifications, reports,

      // Appointments
      bookAppointment,
      updateAppointmentStatus,
      getPartnerAppointments,
      getUserAppointments,
      fetchPartnerAppointments,
      fetchPatientAppointments,
      markOrderDispatched,
      markSampleCollected,
      startVideoCall,
      endVideoCall,
      uploadPrescription,

      // Reports
      uploadReport,
      getReportsByUser,
      getReportByAppointment,

      // Medicines
      addMedicine,
      deleteMedicine,
      getMedicinesByStore,
      fetchMedicinesByStore,
      fetchAllMedicines,

      // Lab Tests
      addLabTest,
      deleteLabTest,
      getLabTestsByLab,
      fetchLabTestsByLab,
      fetchAllLabTests,

      // Notifications
      getNotificationsByUser,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      sendNotification,

      // Partners
      registerPartner,
      getPartnersByRole,

      // Complaints
      submitComplaint,
      fetchAllComplaints,
      complaints,
      updateComplaintStatus,

      // Orders
      orders,
      placeOrder,
      fetchPatientOrders,
      fetchStoreOrders,
      updateOrderStatus,
      bulkAddMedicines,

      // Riders
      fetchAvailableRiderOrders,
      fetchMyDeliveries,
      acceptDelivery,
      completeDelivery,
      fetchLabAvailability,
      saveLabAvailability,
      fetchLabSlots
    }}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointment = () => useContext(AppointmentContext);
