import { useState, useEffect } from 'react';
import { GraduationCap, Clock, CheckCircle, AlertCircle, User, Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MyTrainingTracker = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTrainings();
  }, []);

  const fetchMyTrainings = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get trainings for leads closed by this employee
      const response = await axios.get(`${BACKEND_URL}/api/sales/my-trainings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainings(response.data || []);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      // Show empty state if API fails
      setTrainings([]);
        {
          id: 3,
          clientName: 'Emirates Construction',
          courseName: 'Height Safety Training',
          participants: 25,
          status: 'scheduled',
          progress: 75,
          trainer: 'Mohammed Ali',
          scheduledDate: '2025-12-15',
          location: 'Construction Site - Abu Dhabi',
          leadValue: 12500,
          stages: [
            { name: 'Lead Closed', completed: true, date: '2025-12-02' },
            { name: 'Training Allocated', completed: true, date: '2025-12-04' },
            { name: 'Materials Prepared', completed: true, date: '2025-12-08' },
            { name: 'Training Scheduled', completed: true, date: '2025-12-09' },
            { name: 'Training Delivered', completed: false, date: null },
            { name: 'Certificate Issued', completed: false, date: null }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'scheduled': return 'bg-orange-500/20 text-orange-400 border-orange-400/30';
      case 'pending': return 'bg-red-500/20 text-red-400 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalTrainings = trainings.length;
  const completedTrainings = trainings.filter(t => t.status === 'completed').length;
  const totalRevenue = trainings.reduce((sum, t) => sum + t.leadValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            My Training Progress
          </h3>
          <p className="text-slate-400">
            Track training delivery status for leads you've closed
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">Total Trainings</p>
                <p className="text-2xl font-bold text-blue-300">{totalTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-green-400 font-semibold">Completed</p>
                <p className="text-2xl font-bold text-green-300">{completedTrainings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-yellow-400 font-semibold">Total Revenue</p>
                <p className="text-2xl font-bold text-yellow-300">{totalRevenue.toLocaleString()} AED</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training List */}
      <div className="space-y-4">
        {trainings.map((training) => (
          <Card key={training.id} className="bg-slate-900/50 border-white/10">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg mb-2">
                    {training.courseName}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {training.clientName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {training.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {training.location}
                    </span>
                  </div>
                </div>
                <Badge className={`${getStatusColor(training.status)} flex items-center gap-1`}>
                  {getStatusIcon(training.status)}
                  {training.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-slate-300">{training.progress}%</span>
                </div>
                <Progress value={training.progress} className="h-2" />
              </div>

              {/* Training Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Participants</p>
                  <p className="text-white font-semibold">{training.participants}</p>
                </div>
                <div>
                  <p className="text-slate-400">Trainer</p>
                  <p className="text-white font-semibold">{training.trainer}</p>
                </div>
                <div>
                  <p className="text-slate-400">Lead Value</p>
                  <p className="text-white font-semibold">{training.leadValue.toLocaleString()} AED</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="text-white font-semibold capitalize">
                    {training.status.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Stages Progress */}
              <div className="space-y-2">
                <p className="text-slate-400 text-sm font-medium">Stages:</p>
                <div className="flex flex-wrap gap-2">
                  {training.stages.map((stage, index) => (
                    <Badge
                      key={index}
                      className={
                        stage.completed
                          ? 'bg-green-500/20 text-green-400 border-green-400/30'
                          : 'bg-slate-600/20 text-slate-400 border-slate-400/30'
                      }
                    >
                      {stage.completed && <CheckCircle className="w-3 h-3 mr-1" />}
                      {stage.name}
                      {stage.date && <span className="ml-1 text-xs">({stage.date})</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trainings.length === 0 && (
        <Card className="bg-slate-800/30 border-white/10">
          <CardContent className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-300 text-lg font-semibold mb-2">
              No Training Records Found
            </h3>
            <p className="text-slate-400">
              Training progress will appear here once your closed leads proceed to training delivery.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyTrainingTracker;