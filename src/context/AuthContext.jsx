import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const load = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Hardcoded admin credentials (core company / dev team only) ──
const ADMIN_EMAIL = "ds0854252@gmail.com";
const ADMIN_PASSWORD = "DeepakSingh@123";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("d2d_current_user")) || null
  );

  const [callbackRequests, setCallbackRequests] = useState([]);

  // Fetch callbacks from DB:
  const fetchCallbacks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/callbacks/all`);
      if (res.ok) {
        const json = await res.json();
        setCallbackRequests(json.data || []);
      }
    } catch (err) { console.error("fetchCallbacks:", err); }
  }, []);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  // ── Callback Requests ──
  const addCallbackRequest = useCallback(async (phone) => {
    try {
      const email = user?.email || "anonymous";
      const res = await fetch(`${API}/callbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email })
      });
      const json = await res.json();
      if (res.ok) {
        setCallbackRequests(prev => [json.data, ...prev]);
      }
    } catch (err) { console.error("addCallbackRequest:", err); }
  }, [user?.email]);

  const updateCallbackStatus = useCallback(async (id, status) => {
    try {
      const res = await fetch(`${API}/callbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (res.ok) {
        setCallbackRequests(prev => prev.map(r => (r._id === id || r.id === id) ? json.data : r));
      }
    } catch (err) { console.error("updateCallbackStatus:", err); }
  }, []);

  // ── Helper: Convert Base64 to File for API ──
  const dataURLtoFile = (dataurl, filename) => {
    if (!dataurl || typeof dataurl !== "string" || !dataurl.startsWith("data:")) return dataurl;
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, {type:mime});
  };

  // ── Backend Signup ──
  const backendRegister = useCallback(async (userData) => {
    try {
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        let val = userData[key];
        if (typeof val === "string" && val.startsWith("data:")) {
           const file = dataURLtoFile(val, `${key}.jpg`);
           formData.append(key, file);
        } else if (typeof val === "object" && val !== null) {
           formData.append(key, JSON.stringify(val));
        } else {
           formData.append(key, typeof val === "string" && key === "email" ? val.trim().toLowerCase() : val);
        }
      });

      const res = await fetch(`${API}/auth/register`, { method: "POST", body: formData });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Registration failed (Status: ${res.status})`);
      }
      const json = await res.json();
      setUser(json.data);
      save("d2d_current_user", json.data);
      return json.data;
    } catch (error) {
      console.error(error); throw error;
    }
  }, []);

  // ── Backend Login ──
  const backendLogin = useCallback(async (email, password, role) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email?.trim().toLowerCase(), password, role }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Login failed (Status: ${res.status})`);
      }
      const json = await res.json();
      const loggedUser = json.data.user;
      setUser(loggedUser);
      save("d2d_current_user", loggedUser);
      return loggedUser;
    } catch (error) {
      console.error(error); throw error;
    }
  }, []);


  // ── Old Login (kept for fallback) ──
  const login = useCallback((userData) => {
    setUser(userData);
    save("d2d_current_user", userData);
    const users = load("d2d_users");
    const exists = users.find(u => u.email === userData.email);
    if (!exists) {
      save("d2d_users", [...users, { ...userData, registeredAt: new Date().toISOString() }]);
    } else {
      save("d2d_users", users.map(u => u.email === userData.email ? { ...u, ...userData } : u));
    }
  }, []);

  // ── Admin Login ──
  const adminLogin = useCallback((email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { email, role: "admin", name: "Admin" };
      setUser(adminUser);
      save("d2d_current_user", adminUser);
      return true;
    }
    return false;
  }, []);

  // ── Logout ──
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("d2d_current_user");
  }, []);

  // ── Admin: Approve partner (now calls API only) ──
  const approvePartner = useCallback(async (partnerEmail, role) => {
    try {
      const res = await fetch(`${API}/partners/${role}/${encodeURIComponent(partnerEmail)}/approve`, { method: "PATCH" });
      if (!res.ok) throw new Error("Approval failed");
      return true;
    } catch (err) {
      console.error("approvePartner API error:", err);
      return false;
    }
  }, []);

  // ── Admin: Reject partner (now calls API only) ──
  const rejectPartner = useCallback(async (partnerEmail, role) => {
    try {
      const res = await fetch(`${API}/partners/${role}/${encodeURIComponent(partnerEmail)}/reject`, { method: "PATCH" });
      if (!res.ok) throw new Error("Rejection failed");
      return true;
    } catch (err) {
      console.error("rejectPartner API error:", err);
      return false;
    }
  }, []);

  // ── Get all registered users (for admin) ──
  const getAllUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/users`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error("getAllUsers ERROR:", err);
      return [];
    }
  }, []);

  // ── Get all partners (for admin) — now from API only ──
  const getAllPartners = useCallback(async () => {
    try {
      const res = await fetch(`${API}/partners/all`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error("getAllPartners ERROR:", err);
      return [];
    }
  }, []);

  // ── Check if current partner is approved (reads from current user object) ──
  const isApproved = useCallback(() => {
    if (!user || user.role === "user" || user.role === "admin") return true;
    return user.approved === true;
  }, [user]);

  // ── getAccountStatus — reads live from user object (set after backendLogin) ──
  const getAccountStatus = useCallback(() => {
    if (!user || user.role === "user" || user.role === "admin") return "approved";
    if (user.approved === true) return "approved";
    if (user.rejected === true) return "rejected";
    return "pending";
  }, [user]);

  // ── Update Profile (syncs to API + localStorage) ──
  const updateProfile = useCallback(async (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    save("d2d_current_user", updatedUser);

    // Sync to DB if partner
    if (user?.role && user.role !== "user" && user.role !== "admin") {
      try {
        await fetch(`${API}/partners/${user.role}/${encodeURIComponent(user.email)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
      } catch (err) {
        console.error("updateProfile API error:", err);
      }
    }

    // Also update in local users list
    const users = load("d2d_users");
    save("d2d_users", users.map(u => u.email === updatedUser.email ? { ...u, ...updatedData } : u));

    if (user?.role && user.role !== "user" && user.role !== "admin") {
      const partners = load("d2d_partners");
      save("d2d_partners", partners.map(p => p.email === updatedUser.email ? { ...p, ...updatedData } : p));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, login, backendRegister, backendLogin, logout, adminLogin,
      approvePartner, rejectPartner,
      getAllUsers, getAllPartners,
      isApproved, updateProfile, getAccountStatus,
      ADMIN_EMAIL,
      callbackRequests, addCallbackRequest, updateCallbackStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
