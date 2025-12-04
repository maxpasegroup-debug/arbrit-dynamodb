import { useEffect, useState } from 'react';
import { Calendar, User, MapPin, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerDashboard = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/trainer/my-trainings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainings(response.data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast.error('Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (trainingId, stage, percentage, day) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/trainer/trainings/${trainingId}/progress`,
        {
          progress_stage: stage,
          progress_percentage: percentage,
          current_day: day,
          status: stage === 'Completed' ? 'Completed' : 'In Progress'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Progress updated!');
      fetchTrainings();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const today = trainings.filter(t => {
    const scheduledDates = t.scheduled_dates || [];
    const todayStr = new Date().toISOString().split('T')[0];
    return scheduledDates.some(d => d.startsWith(todayStr));
  });

  const active = trainings.filter(t => ['Allocated', 'Confirmed', 'In Progress'].includes(t.status));
  const completed = trainings.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-300 text-sm">📅 TODAY</p>
              <p className="text-4xl font-bold text-white">{today.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-purple-300 text-sm">📋 ACTIVE</p>
              <p className="text-4xl font-bold text-white">{active.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-blue-300 text-sm">📆 UPCOMING</p>
              <p className="text-4xl font-bold text-white">{trainings.filter(t => t.status === 'Allocated').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-green-300 text-sm">✅ DONE</p>
              <p className="text-4xl font-bold text-white">{completed.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {today.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">🔴 TODAY'S TRAININGS ({today.length})</h3>
          {today.map(training => (
            <Card key={training.id} className="bg-white border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{training.client_name}</h4>
                    <p className="text-purple-300 text-lg">{training.course_name} • Day {training.current_day || 1} of {training.training_days}</p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-400/50">TODAY</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      {training.location}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4" />
                      {training.number_of_participants} Participants
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                    <p className="text-blue-300 font-semibold mb-2">Progress Tracker:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-700 text-sm">Pre-training Preparation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {training.current_day >= 1 ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-blue-400 rounded-full" />
                        )}
                        <span className="text-gray-700 text-sm">Day 1 - {training.current_day === 1 ? 'In Progress' : training.current_day > 1 ? 'Completed' : 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={() => updateProgress(training.id, 'Day 1 In Progress', 40, 1)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={training.current_day >= 1}
                    >
                      Start Day 1
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateProgress(training.id, `Day ${training.current_day + 1}`, training.progress_percentage + 30, training.current_day + 1)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={training.current_day === 0}
                    >
                      Complete Day {training.current_day}
                    </Button>
                    {training.current_day >= training.training_days && (
                      <Button
                        size="sm"
                        onClick={() => updateProgress(training.id, 'Completed', 100, training.training_days)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        ✓ Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">🔵 ACTIVE TRAININGS ({active.length})</h3>
          {active.map(training => (
            <Card key={training.id} className="bg-white border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{training.client_name} • {training.course_name}</h4>
                    <div className="mt-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                            style={{ width: `${training.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">{training.progress_percentage}%</span>
                      </div>
                      <p className="text-gray-500 text-sm">{training.progress_stage} (Day {training.current_day}/{training.training_days})</p>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {training.scheduled_dates?.join(', ')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {training.location}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;