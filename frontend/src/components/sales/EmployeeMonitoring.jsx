import { useEffect, useState } from 'react';
import { Users, Filter, RefreshCw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeMonitoring = () => {
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterBadge, setFilterBadge] = useState('');
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedBadgeTitle, setSelectedBadgeTitle] = useState('');

  useEffect(() => {
    fetchLiveAttendance();
  }, []);

  const fetchLiveAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales-head/attendance/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiveAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = liveAttendance.filter(emp => {
    if (filterBranch && emp.branch !== filterBranch) return false;
    if (filterBadge && emp.badge_title !== filterBadge) return false;
    return true;
  });

  const getStatusColor = (status) => {
    return status === 'Working' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  };

  const handleAssignBadge = (employee) => {
    setSelectedEmployee(employee);
    setSelectedBadgeTitle(employee.badge_title || '');
    setShowBadgeDialog(true);
  };

  const submitBadgeAssignment = async () => {
    if (!selectedBadgeTitle) {
      toast.error('Please select a badge title');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales-head/employees/${selectedEmployee.id}/badge`,
        { badge_title: selectedBadgeTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Badge assigned to ${selectedEmployee.name}`);
      setShowBadgeDialog(false);
      setSelectedEmployee(null);
      setSelectedBadgeTitle('');
      fetchLiveAttendance();
    } catch (error) {
      console.error('Error assigning badge:', error);
      toast.error('Failed to assign badge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-white">Live Employee Monitoring</h3>
            <p className="text-sm text-gray-400">Real-time attendance status of sales team</p>
          </div>
        </div>
        <Button
          data-testid="refresh-attendance"
          onClick={fetchLiveAttendance}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Branch</label>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger data-testid="filter-branch" className="bg-slate-900 border-white/20 text-white">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Saudi">Saudi</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Badge Title</label>
              <Select value={filterBadge} onValueChange={setFilterBadge}>
                <SelectTrigger data-testid="filter-badge" className="bg-slate-900 border-white/20 text-white">
                  <SelectValue placeholder="All Titles" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="all">All Titles</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Assistant Sales Manager">Assistant Sales Manager</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  <SelectItem value="Business Development Executive">Business Development Executive</SelectItem>
                  <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                  <SelectItem value="Tele Caller Executive">Tele Caller Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filterBranch || filterBadge) && (
            <Button
              onClick={() => {
                setFilterBranch('');
                setFilterBadge('');
              }}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white">
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Mobile</TableHead>
              <TableHead className="text-gray-300">Branch</TableHead>
              <TableHead className="text-gray-300">Badge Title</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Last Attendance</TableHead>
              <TableHead className="text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  Loading attendance data...
                </TableCell>
              </TableRow>
            ) : filteredAttendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendance.map((emp) => (
                <TableRow key={emp.id} className="border-white/20 hover:bg-white">
                  <TableCell className="text-white font-medium">{emp.name}</TableCell>
                  <TableCell className="text-gray-300">{emp.mobile}</TableCell>
                  <TableCell className="text-gray-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                      {emp.branch}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-300">{emp.badge_title}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(emp.status)}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {emp.last_attendance || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      data-testid={`assign-badge-${emp.id}`}
                      onClick={() => handleAssignBadge(emp)}
                      variant="ghost"
                      size="sm"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                    >
                      <Award className="w-4 h-4 mr-1" />
                      Assign Badge
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-sm text-green-300 mb-1">Working Now</p>
          <p className="text-3xl font-bold text-white">
            {filteredAttendance.filter(e => e.status === 'Working').length}
          </p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <p className="text-sm text-orange-300 mb-1">Not Working</p>
          <p className="text-3xl font-bold text-white">
            {filteredAttendance.filter(e => e.status === 'Not Working').length}
          </p>
        </div>
      </div>

      {/* Badge Assignment Dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Assign Badge Title
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEmployee && (
              <div className="bg-slate-900 rounded-lg p-3 border border-white/20">
                <p className="text-sm text-gray-400">Employee</p>
                <p className="text-lg font-semibold text-white">{selectedEmployee.name}</p>
                <p className="text-sm text-gray-400">{selectedEmployee.mobile}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Select Badge Title</label>
              <Select value={selectedBadgeTitle} onValueChange={setSelectedBadgeTitle}>
                <SelectTrigger data-testid="badge-select" className="bg-slate-900 border-white/20 text-white">
                  <SelectValue placeholder="Choose a badge title" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Assistant Sales Manager">Assistant Sales Manager</SelectItem>
                  <SelectItem value="Team Leader">Team Leader</SelectItem>
                  <SelectItem value="Business Development Executive">Business Development Executive</SelectItem>
                  <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                  <SelectItem value="Tele Caller Executive">Tele Caller Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                <strong>Note:</strong> This badge will be visible on the employee's dashboard and represents their hierarchy position in the sales team.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBadgeDialog(false);
                setSelectedEmployee(null);
                setSelectedBadgeTitle('');
              }}
              className="border-white/20 text-white hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-badge-button"
              onClick={submitBadgeAssignment}
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
              className="text-[#0a1e3d] font-semibold"
            >
              Assign Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeMonitoring;
