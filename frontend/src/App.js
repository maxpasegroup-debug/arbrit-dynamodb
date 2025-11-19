import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import DashboardCOO from "@/pages/DashboardCOO";
import HRMDashboard from "@/pages/HRMDashboard";
import HRDashboard from "@/pages/HRDashboard";
import SalesHeadDashboard from "@/pages/SalesHeadDashboard";
import SalesEmployeeDashboard from "@/pages/SalesEmployeeDashboard";
import TeleSalesDashboard from "@/pages/TeleSalesDashboard";
import FieldSalesDashboard from "@/pages/FieldSalesDashboard";
import AcademicHeadDashboard from "@/pages/AcademicHeadDashboard";
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
          <Route path="/dashboard/sales-head" element={<SalesHeadDashboard />} />
          <Route path="/dashboard/sales-employee" element={<SalesEmployeeDashboard />} />
          <Route path="/dashboard/tele-sales" element={<TeleSalesDashboard />} />
          <Route path="/dashboard/field-sales" element={<FieldSalesDashboard />} />
          <Route path="/dashboard/academic" element={<AcademicHeadDashboard />} />
          <Route path="/hrm" element={<HRMDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;