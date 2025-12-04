import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Trash2, AlertTriangle, User, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function MasterCleanupPanel() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/employees/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const fetchEmployeeData = async (employeeId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/employee-data/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeData(response.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    fetchEmployeeData(employee.id);
  };

  const handleDeleteData = async (dataType) => {
    if (!selectedEmployee) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete all ${dataType.replace('_', ' ')} for ${selectedEmployee.name}? This action cannot be undone!`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/employee-data/${selectedEmployee.id}/${dataType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Successfully deleted ${dataType.replace('_', ' ')}`);
      
      // Refresh employee data
      fetchEmployeeData(selectedEmployee.id);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data');
    } finally {
      setDeleting(false);
    }
  };

  const handleCleanupAll = async () => {
    const confirmDelete = window.confirm(
      '⚠️ WARNING: This will delete ALL demo data from the entire system!\n\n' +
      'This includes:\n' +
      '- All leads\n' +
      '- All quotations\n' +
      '- All invoices\n' +
      '- All leave requests\n' +
      '- All expense claims\n' +
      '- All other business data\n\n' +
      'The 35 users/employees will NOT be affected.\n\n' +
      'Are you absolutely sure?'
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/admin/cleanup-demo-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('System cleanup completed successfully!');
      console.log('Cleanup results:', response.data);
      
      // Clear selected employee data
      setSelectedEmployee(null);
      setEmployeeData(null);
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error('Failed to cleanup system');
    } finally {
      setDeleting(false);
    }
  };

  const getDataCategory = (key) => {
    const categories = {
      leads_assigned: { label: 'Leads Assigned', icon: '📋', color: 'blue' },
      leads_created: { label: 'Leads Created', icon: '✏️', color: 'green' },
      quotations: { label: 'Quotations', icon: '📄', color: 'purple' },
      invoices: { label: 'Invoices', icon: '💰', color: 'yellow' },
      leave_requests: { label: 'Leave Requests', icon: '🏖️', color: 'orange' },
      expense_claims: { label: 'Expense Claims', icon: '💸', color: 'red' },
      visit_logs: { label: 'Visit Logs', icon: '📍', color: 'teal' },
      attendance: { label: 'Attendance Records', icon: '📊', color: 'indigo' }
    };
    return categories[key] || { label: key, icon: '📁', color: 'gray' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6" />
            Master Cleanup Panel
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage and remove employee data across the system
          </p>
        </div>

        <Button
          onClick={handleCleanupAll}
          disabled={deleting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Cleanup All System Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Selector */}
        <Card className="bg-gray-50/50 border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Select Employee
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => handleEmployeeSelect(emp)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedEmployee?.id === emp.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100/50 text-slate-300 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{emp.name}</div>
                <div className="text-xs opacity-75">
                  {emp.department} - {emp.designation}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Employee Data Display */}
        <Card className="bg-gray-50/50 border-gray-200 p-6 lg:col-span-2">
          {!selectedEmployee ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <User className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Select an employee to view their data</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : employeeData ? (
            <div className="space-y-4">
              {/* Employee Info */}
              <div className="bg-gray-100/50 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-2">
                  {employeeData.employee.name}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <div>Department: {employeeData.employee.department}</div>
                  <div>Designation: {employeeData.employee.designation}</div>
                  <div>Mobile: {employeeData.employee.mobile}</div>
                </div>
              </div>

              {/* Data Categories */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Associated Data
                </h4>

                {Object.entries(employeeData.data).map(([key, value]) => {
                  const category = getDataCategory(key);
                  const hasData = value.count > 0;

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border ${
                        hasData
                          ? 'bg-gray-100/30 border-gray-200'
                          : 'bg-gray-50/30 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <div className="font-medium text-white">
                              {category.label}
                            </div>
                            <div className={`text-sm ${
                              hasData ? 'text-yellow-400' : 'text-slate-500'
                            }`}>
                              {value.count} record{value.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        {hasData && (
                          <Button
                            onClick={() => handleDeleteData(key)}
                            disabled={deleting}
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>

                      {hasData && value.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="text-xs text-slate-400 mb-2">
                            Sample records:
                          </div>
                          <div className="space-y-1">
                            {value.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-xs text-slate-500">
                                • {item.company || item.client || item.type || item.date || 'Record'} 
                                {item.status && ` (${item.status})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <strong>Warning:</strong> Deleted data cannot be recovered. Make sure you have backups if needed.
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
