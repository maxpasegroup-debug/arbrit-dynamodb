import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingSchedule = () => {
  const [sessions, setSessions] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/training-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      // Silent fail - no toast on empty data
    }
  };

  const handleUpdateStatus = (session) => {
    setSelectedSession(session);
    setStatusUpdate({ status: session.status, notes: '' });
    setShowDialog(true);
  };

  const submitStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/academic/training-sessions/${selectedSession.id}/update-status`,
        statusUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Session status updated');
      setShowDialog(false);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'In-Progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Completed': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Cancelled': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors['Scheduled'];
  };

  const upcomingSessions = sessions.filter(s => s.status === 'Scheduled');
  const activeSessions = sessions.filter(s => s.status === 'In-Progress');
  const completedSessions = sessions.filter(s => s.status === 'Completed');

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <Calendar className="w-6 h-6 text-purple-400" />
        Training Schedule Overview
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-400">Upcoming Sessions</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{upcomingSessions.length}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-400">Active Sessions</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{activeSessions.length}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-400">Completed</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{completedSessions.length}</p>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Upcoming Training Sessions</h4>
        <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">WO Reference</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Trainer</TableHead>
                <TableHead className="text-gray-300">Location</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">No upcoming sessions</TableCell>
                </TableRow>
              ) : (
                upcomingSessions.map((session) => (
                  <TableRow key={session.id} className="border-gray-200">
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        {new Date(session.training_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{session.work_order_reference}</TableCell>
                    <TableCell className="text-gray-300">{session.client_name}</TableCell>
                    <TableCell className="text-gray-300">{session.course}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {session.trainer_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {session.location}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={getStatusColor(session.status)}>{session.status}</Badge></TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleUpdateStatus(session)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:bg-blue-500/10"
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Completed Sessions */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Completed Sessions ({completedSessions.length})</h4>
        <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Trainer</TableHead>
                <TableHead className="text-gray-300">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">No completed sessions</TableCell>
                </TableRow>
              ) : (
                completedSessions.slice(0, 5).map((session) => (
                  <TableRow key={session.id} className="border-gray-200">
                    <TableCell className="text-gray-300">{new Date(session.training_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-white font-medium">{session.client_name}</TableCell>
                    <TableCell className="text-gray-300">{session.course}</TableCell>
                    <TableCell className="text-gray-300">{session.trainer_name}</TableCell>
                    <TableCell className="text-gray-300">{session.attendance_count || '-'} participants</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white">
          <DialogHeader>
            <DialogTitle>Update Session Status</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-3">
                <p><span className="text-gray-400">Client:</span> <span className="font-semibold">{selectedSession.client_name}</span></p>
                <p><span className="text-gray-400">Course:</span> {selectedSession.course}</p>
                <p><span className="text-gray-400">Date:</span> {new Date(selectedSession.training_date).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Status</label>
                <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({...statusUpdate, status: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-gray-300 text-white">
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In-Progress">In-Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Notes</label>
                <Textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                  rows={3}
                  className="bg-white border-gray-300 text-white"
                  placeholder="Add any notes about the session..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-gray-300 text-white">Cancel</Button>
            <Button onClick={submitStatusUpdate} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingSchedule;