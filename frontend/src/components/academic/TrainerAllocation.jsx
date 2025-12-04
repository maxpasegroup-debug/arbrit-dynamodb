import { useEffect, useState } from 'react';
import { Users, Search, MapPin, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerAllocation = () => {
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/trainers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainers(response.data || []);
      setFilteredTrainers(response.data || []);
      
      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await axios.get(`${API}/hrm/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const attendanceMap = {};
      (attendanceRes.data || []).forEach(rec => {
        if (rec.date === today) {
          attendanceMap[rec.employee_id] = 'Present';
        }
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      // Silent fail - no toast on empty data
    }
  };

  useEffect(() => {
    let filtered = trainers;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (branchFilter && branchFilter !== 'all') {
      filtered = filtered.filter(t => t.branch === branchFilter);
    }

    setFilteredTrainers(filtered);
  }, [searchTerm, branchFilter, trainers]);

  const branches = [...new Set(trainers.map(t => t.branch).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          Trainer Pool Management
        </h3>
      </div>

      {/* Filters */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Search Trainer</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border-gray-300 text-white pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Filter by Branch</label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-white">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="text-sm">
              <span className="text-gray-400">Total Trainers: </span>
              <span className="text-white font-semibold">{filteredTrainers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trainers Table */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Designation</TableHead>
              <TableHead className="text-gray-300">Branch</TableHead>
              <TableHead className="text-gray-300">Mobile</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No trainers found
                </TableCell>
              </TableRow>
            ) : (
              filteredTrainers.map((trainer) => (
                <TableRow key={trainer.id} className="border-gray-200">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-400" />
                      {trainer.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{trainer.designation || 'Trainer'}</TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {trainer.branch || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{trainer.mobile || 'N/A'}</TableCell>
                  <TableCell>
                    {attendance[trainer.id] === 'Present' ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Present Today</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Absent</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TrainerAllocation;