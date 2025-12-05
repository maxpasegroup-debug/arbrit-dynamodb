import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Receipt, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DepartmentWiseEmployees from '@/components/hrm/DepartmentWiseEmployees';
import EmployeeManagement from '@/components/hrm/EmployeeManagement';
import AttendanceManagement from '@/components/hrm/AttendanceManagement';
import EmployeeRecords from '@/components/hrm/EmployeeRecords';
import CompanyDocuments from '@/components/hrm/CompanyDocuments';
import ExpenseSubmission from '@/components/expenses/ExpenseSubmission';
import ExpenseHRReview from '@/components/expenses/ExpenseHRReview';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HRDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      try {
        // Verify token with backend
        const response = await axios.get(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const userInfo = response.data;
        
        // Check if user has HR role or is COO/MD (with viewing access)
        if (!['HR', 'COO', 'MD', 'CEO'].includes(userInfo.role)) {
          toast.error('Access denied. HR access required.');
          navigate('/login');
          return;
        }

        setUser(userInfo);
        setLoading(false);
      } catch (error) {
        console.error('Auth verification failed:', error);
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
      }}>
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
    }}>
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_b916bfee-a2e0-4a78-a130-e219040d5774/artifacts/qhdckkjh_ARBRIT.jpeg" 
                alt="Arbrit Logo" 
                className="h-12 w-12 object-contain bg-white rounded-lg p-1"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <h1 className="text-2xl font-bold text-white">HR Dashboard</h1>
                </div>
                <p className="text-sm text-gray-400">Human Resource Management</p>
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-300">HR Manager</p>
              </div>
              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-300 text-green-400 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-white/5  rounded-xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-300">
            Manage employees, attendance, and documents from your HR dashboard.
          </p>
        </div>

        {/* HRM Modules Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white/5 backdrop-blur-sm border border-white/10">
            <TabsTrigger 
              value="employees" 
              data-testid="tab-employees"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Employee Management
            </TabsTrigger>
            <TabsTrigger 
              value="attendance"
              data-testid="tab-attendance"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="records"
              data-testid="tab-records"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
            >
              Employee Records
            </TabsTrigger>
            <TabsTrigger 
              value="company"
              data-testid="tab-company"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
            >
              Company Documents
            </TabsTrigger>
            <TabsTrigger 
              value="my-expenses"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
            >
              <Receipt className="w-4 h-4 mr-2" />
              My Expenses
            </TabsTrigger>
            <TabsTrigger 
              value="expense-review"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-white text-gray-300"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Expense Review
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="employees" className="mt-0">
              <DepartmentWiseEmployees />
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <AttendanceManagement />
            </TabsContent>

            <TabsContent value="records" className="mt-0">
              <EmployeeRecords />
            </TabsContent>

            <TabsContent value="company" className="mt-0">
              <CompanyDocuments />
            </TabsContent>

            <TabsContent value="my-expenses" className="mt-0">
              <ExpenseSubmission />
            </TabsContent>

            <TabsContent value="expense-review" className="mt-0">
              <ExpenseHRReview />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default HRDashboard;
