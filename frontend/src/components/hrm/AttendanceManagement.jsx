import { useEffect, useState } from 'react';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            long: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handleMarkAttendance = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    setLoading(true);
    try {
      // Get GPS location
      const location = await getCurrentLocation();
      setGpsLocation(location);

      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/hrm/attendance`,
        {
          employee_id: selectedEmployee,
          gps_lat: location.lat,
          gps_long: location.long
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Attendance marked successfully');
      setShowDialog(false);
      setSelectedEmployee('');
      setGpsLocation(null);
      fetchAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      if (error.message.includes('Geolocation')) {
        toast.error('Please enable location access to mark attendance');
      } else {
        toast.error('Failed to mark attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Attendance Records</h3>
          <p className="text-sm text-gray-400 mt-1">Auto-recorded with GPS location during working hours</p>
        </div>
        <Button
          data-testid="mark-attendance-button"
          onClick={() => setShowDialog(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d] font-semibold"
        >
          <Clock className="w-4 h-4 mr-2" />
          Mark Attendance
        </Button>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white">
              <TableHead className="text-gray-300">Employee Name</TableHead>
              <TableHead className="text-gray-300">Mobile</TableHead>
              <TableHead className="text-gray-300">Date</TableHead>
              <TableHead className="text-gray-300">Time</TableHead>
              <TableHead className="text-gray-300">GPS Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((record) => (
                <TableRow key={record.id} className="border-white/10 hover:bg-white">
                  <TableCell className="text-white font-medium">{record.employee_name}</TableCell>
                  <TableCell className="text-gray-300">{record.mobile}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      {record.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      {record.time}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {record.gps_lat && record.gps_long ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <a
                          href={`https://www.google.com/maps?q=${record.gps_lat},${record.gps_long}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          View on Map
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mark Attendance Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Mark Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger data-testid="attendance-employee-select" className="bg-slate-900 border-white/20 text-white">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-300">GPS Location Tracking</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your current GPS location will be recorded automatically when marking attendance.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setSelectedEmployee('');
                setGpsLocation(null);
              }}
              className="border-white/20 text-white hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              data-testid="submit-attendance-button"
              onClick={handleMarkAttendance}
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
              className="text-[#0a1e3d] font-semibold"
            >
              Mark Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceManagement;