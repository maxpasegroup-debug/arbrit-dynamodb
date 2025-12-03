import { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  User,
  Building,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingTrackerMetro = () => {
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const statuses = [
    'Requested',
    'Allocated', 
    'Scheduled',
    'In Progress',
    'Assessment',
    'Certification',
    'Completed'
  ];

  useEffect(() => {
    fetchTrainings();
  }, []);

  useEffect(() => {
    filterTrainings();
  }, [trainings, searchTerm]);

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

  const filterTrainings = () => {
    let filtered = [...trainings];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(training =>
        (training.company_name || '').toLowerCase().includes(search) ||
        (training.course_name || '').toLowerCase().includes(search) ||
        (training.location || '').toLowerCase().includes(search) ||
        (training.trainer_name || '').toLowerCase().includes(search)
      );
    }

    setFilteredTrainings(filtered);
  };

  const handleUpdateStatus = async (trainingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/academic/training-requests/${trainingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Training moved to ${newStatus}`);
      fetchTrainings();
    } catch (error) {
      console.error('Error updating training status:', error);
      toast.error('Failed to update training status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Requested': 'bg-blue-500',
      'Allocated': 'bg-cyan-500',
      'Scheduled': 'bg-purple-500',
      'In Progress': 'bg-yellow-500',
      'Assessment': 'bg-orange-500',
      'Certification': 'bg-pink-500',
      'Completed': 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Requested': AlertCircle,
      'Allocated': Users,
      'Scheduled': Calendar,
      'In Progress': Clock,
      'Assessment': BookOpen,
      'Certification': Award,
      'Completed': CheckCircle
    };
    return icons[status] || AlertCircle;
  };

  const groupedTrainings = statuses.reduce((acc, status) => {
    acc[status] = filteredTrainings.filter(t => t.status === status);
    return acc;
  }, {});

  const exportToCSV = () => {
    const headers = ['Company', 'Course', 'Location', 'Participants', 'Status', 'Date', 'Trainer'];
    const rows = filteredTrainings.map(t => [
      t.company_name,
      t.course_name,
      t.location,
      t.number_of_participants,
      t.status,
      t.requested_date,
      t.trainer_name || 'Not assigned'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const count = groupedTrainings[status]?.length || 0;
          const StatusIcon = getStatusIcon(status);
          const colorClass = getStatusColor(status);
          
          return (
            <div
              key={status}
              className="flex-shrink-0 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 min-w-[180px]"
            >
              <div className="flex items-center gap-3">
                <div className={`${colorClass} p-2 rounded-lg`}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-gray-400">{status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company, course, location, or trainer..."
              className="pl-10 bg-slate-800 border-white/10 text-slate-100"
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          className="border-white/20 hover:bg-white/10"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Metro Pipeline */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
          {statuses.map((status, statusIndex) => {
            const trainingsInStatus = groupedTrainings[status] || [];
            const StatusIcon = getStatusIcon(status);
            const colorClass = getStatusColor(status);

            return (
              <div
                key={status}
                className="flex-shrink-0 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4"
                style={{ width: '320px' }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`${colorClass} p-2 rounded-lg`}>
                      <StatusIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{status}</h3>
                      <p className="text-xs text-gray-400">{trainingsInStatus.length} trainings</p>
                    </div>
                  </div>
                </div>

                {/* Training Cards */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {trainingsInStatus.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No trainings in {status.toLowerCase()}
                    </div>
                  ) : (
                    trainingsInStatus.map((training) => (
                      <div
                        key={training.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedTraining(training);
                          setDetailsOpen(true);
                        }}
                      >
                        {/* Company Name */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white text-sm line-clamp-1">
                            {training.company_name || 'N/A'}
                          </h4>
                          <Badge className={`${colorClass} text-white text-xs px-2 py-0.5`}>
                            {status}
                          </Badge>
                        </div>

                        {/* PROGRESS MAP - Journey Tracker */}
                        <div className="mb-3 p-2 bg-slate-900/50 rounded border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            {statuses.map((s, idx) => {
                              const currentStatusIndex = statuses.indexOf(training.status);
                              const isCompleted = idx < currentStatusIndex;
                              const isCurrent = idx === currentStatusIndex;
                              const StageIcon = getStatusIcon(s);
                              
                              return (
                                <div key={s} className="flex items-center">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      isCompleted
                                        ? 'bg-green-500'
                                        : isCurrent
                                        ? getStatusColor(s)
                                        : 'bg-slate-700'
                                    }`}
                                    title={s}
                                  >
                                    <StageIcon className="w-3 h-3 text-white" />
                                  </div>
                                  {idx < statuses.length - 1 && (
                                    <div
                                      className={`w-4 h-0.5 ${
                                        isCompleted ? 'bg-green-500' : 'bg-slate-700'
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>Start</span>
                            <span>{Math.round((statuses.indexOf(training.status) / (statuses.length - 1)) * 100)}%</span>
                            <span>End</span>
                          </div>
                        </div>

                        {/* Course Name */}
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-3 h-3 text-yellow-400" />
                          <p className="text-xs text-gray-300 line-clamp-1">{training.course_name || 'N/A'}</p>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          <p className="text-xs text-gray-400">{training.location || 'Not specified'}</p>
                        </div>

                        {/* Participants */}
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-3 h-3 text-green-400" />
                          <p className="text-xs text-gray-400">{training.number_of_participants || 0} participants</p>
                        </div>

                        {/* Date */}
                        {training.requested_date && (
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <p className="text-xs text-gray-400">
                              {new Date(training.requested_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {/* Trainer */}
                        {training.trainer_name && (
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-3 h-3 text-cyan-400" />
                            <p className="text-xs text-gray-300">{training.trainer_name}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          {statusIndex < statuses.length - 1 && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(training.id, statuses[statusIndex + 1]);
                              }}
                              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-xs"
                            >
                              Move to {statuses[statusIndex + 1]}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTraining(training);
                              setDetailsOpen(true);
                            }}
                            className="border-white/20 text-white hover:bg-white/10 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Training Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-2xl">
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
                  <p className="text-white">{selectedTraining.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Participants</p>
                  <p className="text-white">{selectedTraining.number_of_participants || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <Badge className={`${getStatusColor(selectedTraining.status)} text-white`}>
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
                  <p className="text-white bg-white/5 p-3 rounded-lg">{selectedTraining.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingTrackerMetro;
