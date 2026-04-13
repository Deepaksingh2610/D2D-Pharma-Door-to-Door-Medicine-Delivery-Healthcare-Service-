import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import { MedicalProvider } from "./context/MedicalContext";
import { CartProvider } from "./context/CartContext";
import { AppointmentProvider } from "./context/AppointmentContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppointmentProvider>
        <LocationProvider>
          <MedicalProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </MedicalProvider>
        </LocationProvider>
      </AppointmentProvider>
    </AuthProvider>
  </React.StrictMode>
);
