import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Send, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateRequest = () => {
  const [completedSessions, setCompletedSessions] = useState([]);
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [selectedSession, setSelectedSession] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [sessionsRes, requestsRes] = await Promise.all([
        axios.get(`${API}/academic/trainer/completed-sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/academic/trainer/certificate-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCompletedSessions(sessionsRes.data || []);
      setCertificateRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async () => {
    if (!selectedSession) {
      toast.error('Please select a completed session');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/academic/trainer/request-certificate`,
        { session_id: selectedSession },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Certificate request submitted successfully');
      setSelectedSession(undefined);
      fetchData();
    } catch (error) {
      console.error('Error requesting certificate:', error);
      toast.error('Failed to submit certificate request');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-400/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-400/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request New Certificate */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Request Certificate</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Request certificates for completed training sessions</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Completed Session
            </label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Choose a session" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-white/20">
                {completedSessions.length === 0 ? (
                  <SelectItem value="no-sessions" disabled>
                    No completed sessions available
                  </SelectItem>
                ) : (
                  completedSessions.map((session) => (
                    <SelectItem 
                      key={session.id} 
                      value={session.id}
                      className="text-white hover:bg-white/10"
                    >
                      {session.course_name} - {session.client_name} ({new Date(session.date).toLocaleDateString()})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleRequestCertificate}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Requests History */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Certificate Requests History</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Track your certificate requests</p>
        </CardHeader>
        <CardContent className="p-6">
          {certificateRequests.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No certificate requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificateRequests.map((req) => (
                <Card key={req.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                          <Award className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{req.course_name}</h4>
                          <p className="text-sm text-gray-400">{req.client_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              Requested: {new Date(req.requested_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(req.status)}>
                        {req.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateRequest;
