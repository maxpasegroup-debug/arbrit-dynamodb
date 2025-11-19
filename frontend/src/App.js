import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import COODashboard from "@/pages/COODashboard";
import MDDashboard from "@/pages/MDDashboard";
import HRMDashboard from "@/pages/HRMDashboard";
import HRDashboard from "@/pages/HRDashboard";
import SalesHeadDashboard from "@/pages/SalesHeadDashboard";
import SalesEmployeeDashboard from "@/pages/SalesEmployeeDashboard";
import TeleSalesDashboard from "@/pages/TeleSalesDashboard";
import FieldSalesDashboard from "@/pages/FieldSalesDashboard";
import AcademicHeadDashboard from "@/pages/AcademicHeadDashboard";
import AcademicCoordinatorDashboard from "@/pages/AcademicCoordinatorDashboard";
import TrainerDashboard from "@/pages/TrainerDashboard";
import DispatchHeadDashboard from "@/pages/DispatchHeadDashboard";
import DispatchAssistantDashboard from "@/pages/DispatchAssistantDashboard";
import AccountsDashboard from "@/pages/AccountsDashboard";
import PublicAssessmentForm from "@/pages/PublicAssessmentForm";
import Diagnostics from "@/pages/Diagnostics";
import BrowserBackWarning from '@/components/common/BrowserBackWarning';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <BrowserBackWarning />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/coo" element={<COODashboard />} />
          <Route path="/dashboard/md" element={<MDDashboard />} />
          <Route path="/dashboard/hr" element={<HRDashboard />} />
          <Route path="/dashboard/sales-head" element={<SalesHeadDashboard />} />
          <Route path="/dashboard/sales-employee" element={<SalesEmployeeDashboard />} />
          <Route path="/dashboard/tele-sales" element={<TeleSalesDashboard />} />
          <Route path="/dashboard/field-sales" element={<FieldSalesDashboard />} />
          <Route path="/dashboard/academic" element={<AcademicHeadDashboard />} />
          <Route path="/dashboard/coordinator" element={<AcademicCoordinatorDashboard />} />
          <Route path="/dashboard/trainer" element={<TrainerDashboard />} />
          <Route path="/dashboard/dispatch" element={<DispatchHeadDashboard />} />
          <Route path="/dashboard/dispatch-assistant" element={<DispatchAssistantDashboard />} />
          <Route path="/dashboard/accounts" element={<AccountsDashboard />} />
          <Route path="/hrm" element={<HRMDashboard />} />
          <Route path="/public/assessment/:form_id" element={<PublicAssessmentForm />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;