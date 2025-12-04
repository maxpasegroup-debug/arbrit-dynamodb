import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Eye, 
  CheckCircle, 
  Clock, 
  Calendar,
  AlertTriangle, 
  AlertCircle,
  Users,
  MapPin,
  BookOpen,
  User,
  Building,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingTrackerMetroNew = () => {
  const [trainings, setTrainings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const stages = [
    { id: 'Requested', label: 'Requested', icon: AlertCircle, color: 'bg-blue-500' },
    { id: 'Allocated', label: 'Allocated', icon: Users, color: 'bg-cyan-500' },
    { id: 'Scheduled', label: 'Scheduled', icon: Calendar, color: 'bg-purple-500' },
    { id: 'In Progress', label: 'In Progress', icon: Clock, color: 'bg-yellow-500' },
    { id: 'Assessment', label: 'Assessment', icon: BookOpen, color: 'bg-orange-500' },
    { id: 'Certification', label: 'Certification', icon: GraduationCap, color: 'bg-pink-500' },
    { id: 'Completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-500' }
  ];

  useEffect(() => {
    fetchTrainings();
    fetchStats();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/training-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainings(response.data || []);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast.error('Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const allTrainings = await axios.get(`${API}/academic/training-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = allTrainings.data || [];
      const statsData = {
        total: data.length,
        requested: data.filter(t => t.status === 'Requested').length,
        allocated: data.filter(t => t.status === 'Allocated').length,
        scheduled: data.filter(t => t.status === 'Scheduled').length,
        inProgress: data.filter(t => t.status === 'In Progress').length,
        assessment: data.filter(t => t.status === 'Assessment').length,
        certification: data.filter(t => t.status === 'Certification').length,
        completed: data.filter(t => t.status === 'Completed').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (trainingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/academic/training-requests/${trainingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Training moved to ${newStatus}`);
      fetchTrainings();
      fetchStats();
    } catch (error) {
      console.error('Error updating training status:', error);
      toast.error('Failed to update training status');
    }
  };

  const getStageIndex = (status) => {
    return stages.findIndex(s => s.id === status);
  };

  const filteredByStatus = filterStatus === 'all' 
    ? trainings 
    : trainings.filter(t => t.status === filterStatus);

  const groupedByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredByStatus.filter(t => t.status === stage.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Training Tracker</h2>
            </div>
            <p className="text-gray-700">Metro-style tracking from initiation to completion</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
        <TabsList className="bg-white border border-gray-300">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/20">
            <BookOpen className="w-4 h-4 mr-2" />
            All Trainings ({stats?.total || 0})
          </TabsTrigger>
          {stages.map((stage) => {
            const count = stats?.[stage.id.toLowerCase().replace(' ', '')] || 0;
            const Icon = stage.icon;
            return (
              <TabsTrigger 
                key={stage.id} 
                value={stage.id}
                className="data-[state=active]:bg-white/20"
              >
                <Icon className="w-4 h-4 mr-2" />
                {stage.label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Metro Pipeline View */}
        <TabsContent value={filterStatus} className="mt-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage, stageIndex) => {
              const trainingsInStage = groupedByStage[stage.id] || [];
              const Icon = stage.icon;
              
              return (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-80"
                >
                  {/* Stage Header */}
                  <div className={`${stage.color} rounded-t-xl p-4`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <div>
                          <h3 className="font-semibold">{stage.label}</h3>
                          <p className="text-xs opacity-80">{trainingsInStage.length} trainings</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Training Cards */}
                  <div className="bg-white backdrop-blur-sm rounded-b-xl border border-gray-200 p-4 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                    {trainingsInStage.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No trainings in {stage.label.toLowerCase()}
                      </div>
                    ) : (
                      trainingsInStage.map((training) => {
                        const currentStageIndex = getStageIndex(training.status);
                        const progressPercentage = Math.round((currentStageIndex / (stages.length - 1)) * 100);
                        
                        return (
                          <div
                            key={training.id}
                            className="bg-gray-50/80 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                            onClick={() => {
                              setSelectedTraining(training);
                              setDetailsOpen(true);
                            }}
                          >
                            {/* Company Name & Badge */}
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-white text-sm">
                                {training.company_name || 'N/A'}
                              </h4>
                              <Badge className={`${stage.color} text-white text-xs`}>
                                {stage.label}
                              </Badge>
                            </div>

                            {/* Progress Map */}
                            <div className="mb-3 p-2 bg-white0 rounded border border-white/5">
                              <div className="flex items-center justify-between mb-1">
                                {stages.map((s, idx) => {
                                  const isCompleted = idx < currentStageIndex;
                                  const isCurrent = idx === currentStageIndex;
                                  const StageIcon = s.icon;
                                  
                                  return (
                                    <div key={s.id} className="flex items-center">
                                      <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                          isCompleted
                                            ? 'bg-green-500'
                                            : isCurrent
                                            ? s.color
                                            : 'bg-gray-100'
                                        }`}
                                        title={s.label}
                                      >
                                        <StageIcon className="w-3 h-3 text-white" />
                                      </div>
                                      {idx < stages.length - 1 && (
                                        <div
                                          className={`w-3 h-0.5 ${
                                            isCompleted ? 'bg-green-500' : 'bg-gray-100'
                                          }`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-center text-[10px] text-slate-400">
                                {progressPercentage}% Complete
                              </div>
                            </div>

                            {/* Training Details */}
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-slate-300">
                                <BookOpen className="w-3 h-3 text-yellow-400" />
                                <span className="line-clamp-1">{training.course_name || 'N/A'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-slate-300">
                                <MapPin className="w-3 h-3 text-blue-400" />
                                <span>{training.location || training.training_location || 'Not specified'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-slate-300">
                                <Users className="w-3 h-3 text-green-400" />
                                <span>{training.number_of_participants || 0} participants</span>
                              </div>

                              {training.requested_date && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Calendar className="w-3 h-3 text-purple-400" />
                                  <span>{new Date(training.requested_date).toLocaleDateString()}</span>
                                </div>
                              )}

                              {training.trainer_name && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <User className="w-3 h-3 text-cyan-400" />
                                  <span>{training.trainer_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {stageIndex < stages.length - 1 && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(training.id, stages[stageIndex + 1].id);
                                }}
                                className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-xs"
                                size="sm"
                              >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                Update Status
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Training Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Training Details</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Company</p>
                  <p className="text-white font-semibold">{selectedTraining.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Course</p>
                  <p className="text-white font-semibold">{selectedTraining.course_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white">{selectedTraining.location || selectedTraining.training_location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Participants</p>
                  <p className="text-white">{selectedTraining.number_of_participants || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <Badge className="bg-yellow-500 text-white">
                    {selectedTraining.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Requested Date</p>
                  <p className="text-white">
                    {selectedTraining.requested_date 
                      ? new Date(selectedTraining.requested_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                {selectedTraining.trainer_name && (
                  <div>
                    <p className="text-sm text-gray-400">Trainer</p>
                    <p className="text-white">{selectedTraining.trainer_name}</p>
                  </div>
                )}
                {selectedTraining.contact_person && (
                  <div>
                    <p className="text-sm text-gray-400">Contact Person</p>
                    <p className="text-white">{selectedTraining.contact_person}</p>
                  </div>
                )}
                {selectedTraining.contact_mobile && (
                  <div>
                    <p className="text-sm text-gray-400">Mobile</p>
                    <p className="text-white">{selectedTraining.contact_mobile}</p>
                  </div>
                )}
              </div>
              
              {selectedTraining.notes && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Notes</p>
                  <p className="text-white bg-white p-3 rounded-lg">{selectedTraining.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingTrackerMetroNew;
