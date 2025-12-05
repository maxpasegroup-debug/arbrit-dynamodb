import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/trainer/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-400/50';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-400/50';
      default: return 'bg-slate-8000/20 text-gray-400 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">My Training Schedule</CardTitle>
          <p className="text-sm text-gray-400 mt-1">View your upcoming training sessions</p>
        </CardHeader>
        <CardContent className="p-6">
          {schedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No training sessions assigned</p>
              <p className="text-sm text-gray-500 mt-2">Your assigned sessions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.map((session) => (
                <Card key={session.id} className="bg-slate-900 border-white/10 hover:bg-white transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1">{session.course_name}</h3>
                        <p className="text-gray-400 text-sm">{session.client_name}</p>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span>{session.start_time} - {session.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{session.location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span>{session.participants || 0} participants</span>
                      </div>
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

export default TrainerSchedule;
