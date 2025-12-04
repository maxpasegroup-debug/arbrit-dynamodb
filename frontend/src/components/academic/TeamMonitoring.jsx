import { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamMonitoring = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const presentToday = teamMembers.filter(m => m.attendance_today === 'Present').length;
  const absentToday = teamMembers.filter(m => m.attendance_today === 'Absent').length;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <Users className="w-6 h-6 text-teal-400" />
        Academic Team Monitoring
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Team Members</p>
          <p className="text-3xl font-bold text-white mt-2">{teamMembers.length}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-400">Present Today</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{presentToday}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absent Today</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{absentToday}</p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Designation</TableHead>
              <TableHead className="text-gray-300">Branch</TableHead>
              <TableHead className="text-gray-300">Mobile</TableHead>
              <TableHead className="text-gray-300">Attendance Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
                <TableRow key={member.id} className="border-gray-200">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{member.designation || 'N/A'}</TableCell>
                  <TableCell className="text-gray-300">{member.branch || 'N/A'}</TableCell>
                  <TableCell className="text-gray-300">{member.mobile || 'N/A'}</TableCell>
                  <TableCell>
                    {member.attendance_today === 'Present' ? (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Present
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        Absent
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Attendance is updated when employees log in to the system each day.
        </p>
      </div>
    </div>
  );
};

export default TeamMonitoring;