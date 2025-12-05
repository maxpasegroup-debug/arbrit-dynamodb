import { useEffect, useState } from 'react';
import { BookOpen, Calendar, User, MapPin, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import TrainingRequestForm from './TrainingRequestForm';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalesTrainingTracker = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/training-requests`, {
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

  const getStatusBadge = (status) => {
    const badges = {
      'Requested': <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50">⏳ Pending</Badge>,
      'Allocated': <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">👨‍🏫 Allocated</Badge>,
      'Confirmed': <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/50">✓ Confirmed</Badge>,
      'In Progress': <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50">🔵 In Progress</Badge>,
      'Completed': <Badge className="bg-green-500/20 text-green-300 border-green-400/50">✅ Completed</Badge>,
      'Reviewed': <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50">⭐ Reviewed</Badge>
    };
    return badges[status] || <Badge className="bg-slate-8000/20 text-gray-300">{status}</Badge>;
  };

  const getProgressSteps = (training) => {
    const steps = ['Requested', 'Allocated', 'Confirmed', 'In Progress', 'Completed', 'Reviewed'];
    const currentIndex = steps.indexOf(training.status);
    
    return (
      <div className="flex items-center gap-2 mt-3">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${
              idx <= currentIndex ? 'bg-green-500' : 'bg-gray-600'
            }`} />
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${
                idx < currentIndex ? 'bg-green-500' : 'bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-400" />
            Training Requests
          </h2>
          <p className="text-slate-400 mt-1">{trainings.length} total requests</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          + Request Training
        </Button>
      </div>

      <div className="grid gap-4">
        {trainings.length === 0 ? (
          <Card className="bg-slate-900 border-white/10">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No training requests yet</p>
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Create First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          trainings.map((training) => (
            <Card key={training.id} className="bg-slate-900 border-white/10 hover:bg-white transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{training.client_name}</h3>
                      {getStatusBadge(training.status)}
                    </div>
                    <p className="text-lg text-purple-300">{training.course_name} • {training.number_of_participants} Participants</p>
                  </div>
                </div>

                {getProgressSteps(training)}
                <p className="text-sm text-slate-400 mt-2">{training.progress_stage}</p>

                {training.trainer_name && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-300">
                      <User className="w-4 h-4" />
                      <span className="font-semibold">Trainer: {training.trainer_name}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {training.scheduled_dates ? training.scheduled_dates.join(', ') : training.preferred_dates.join(' or ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{training.location}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    Last updated: {new Date(training.updated_at).toLocaleString()}
                  </div>
                  {training.status === 'Completed' && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready for Certificate
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TrainingRequestForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={fetchTrainings}
      />
    </div>
  );
};

export default SalesTrainingTracker;