import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import DashboardCOO from "@/pages/DashboardCOO";
import HRMDashboard from "@/pages/HRMDashboard";
import HRDashboard from "@/pages/HRDashboard";
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/coo" element={<DashboardCOO />} />
          <Route path="/dashboard/hr" element={<HRDashboard />} />
          <Route path="/hrm" element={<HRMDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;