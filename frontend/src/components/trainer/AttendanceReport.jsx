import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Send } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AttendanceReport = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(undefined);
  const [attendance, setAttendance] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/trainer/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSession) {
      toast.error('Please select a session');
      return;
    }

    if (!attendance.trim() || !report.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/academic/trainer/attendance-report`,
        {
          session_id: selectedSession,
          attendance,
          report
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Attendance and report submitted successfully');
      setSelectedSession(undefined);
      setAttendance('');
      setReport('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading sessions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Attendance & Session Report</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Mark attendance and submit session reports</p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Session Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Session
            </label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Choose a session" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-white/20">
                {sessions.length === 0 ? (
                  <SelectItem value="no-sessions" disabled>
                    No sessions available
                  </SelectItem>
                ) : (
                  sessions.map((session) => (
                    <SelectItem 
                      key={session.id} 
                      value={session.id}
                      className="text-white hover:bg-white/10"
                    >
                      {session.course_name} - {new Date(session.date).toLocaleDateString()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Attendance */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attendance Details
            </label>
            <Textarea
              placeholder="Enter attendance details (e.g., '25 out of 30 participants present')..."
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-20"
            />
          </div>

          {/* Session Report */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Report
            </label>
            <Textarea
              placeholder="Describe the session, topics covered, participant engagement, issues, etc..."
              value={report}
              onChange={(e) => setReport(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-32"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-500/10 border-blue-400/30">
        <CardContent className="p-4 flex items-start gap-3">
          <ClipboardCheck className="w-5 h-5 text-blue-400 mt-1" />
          <div>
            <h4 className="text-blue-300 font-medium mb-1">Report Submission Guidelines</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• Submit reports within 24 hours of session completion</li>
              <li>• Include accurate attendance count and participant details</li>
              <li>• Note any issues or special observations</li>
              <li>• Mention if any materials were used or additional support needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReport;
