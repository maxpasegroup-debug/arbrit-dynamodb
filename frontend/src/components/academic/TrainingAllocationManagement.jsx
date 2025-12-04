import { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, User, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainingAllocationManagement = () => {
  const [trainingRequests, setTrainingRequests] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const [allocationData, setAllocationData] = useState({
    trainer_id: '',
    trainer_name: '',
    scheduled_dates: [''],
    training_days: 1,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch training requests
      const requestsRes = await axios.get(`${API}/academic/training-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrainingRequests(requestsRes.data || []);
      
      // Fetch trainers
      const employeesRes = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const trainersList = (employeesRes.data || []).filter(e => 
        e.designation?.toUpperCase().includes('TRAINER') ||
        e.role?.toUpperCase().includes('TRAINER')
      );
      setTrainers(trainersList);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load training requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAllocationDialog = (request) => {
    setSelectedRequest(request);
    setAllocationData({
      trainer_id: '',
      trainer_name: '',
      scheduled_dates: request.preferred_dates?.slice(0, 1) || [''],
      training_days: 1,
      notes: ''
    });
    setAllocationDialogOpen(true);
  };

  const handleTrainerChange = (trainerId) => {
    const trainer = trainers.find(t => t.id === trainerId);
    setAllocationData({
      ...allocationData,
      trainer_id: trainerId,
      trainer_name: trainer ? trainer.name : ''
    });
  };

  const handleDateChange = (index, value) => {
    const newDates = [...allocationData.scheduled_dates];
    newDates[index] = value;
    setAllocationData({ ...allocationData, scheduled_dates: newDates });
  };

  const addDateField = () => {
    setAllocationData({
      ...allocationData,
      scheduled_dates: [...allocationData.scheduled_dates, ''],
      training_days: allocationData.scheduled_dates.length + 1
    });
  };

  const removeDateField = (index) => {
    const newDates = allocationData.scheduled_dates.filter((_, i) => i !== index);
    setAllocationData({
      ...allocationData,
      scheduled_dates: newDates,
      training_days: newDates.length
    });
  };

  const handleAllocate = async () => {
    if (!allocationData.trainer_id || allocationData.scheduled_dates.filter(d => d).length === 0) {
      toast.error('Please select a trainer and at least one training date');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/academic/training-requests/${selectedRequest.id}/allocate`,
        {
          ...allocationData,
          scheduled_dates: allocationData.scheduled_dates.filter(d => d),
          training_days: allocationData.scheduled_dates.filter(d => d).length
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Training allocated successfully');
      setAllocationDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error allocating training:', error);
      toast.error('Failed to allocate training');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'Requested': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
      'Allocated': { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle },
      'Confirmed': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      'In Progress': { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Clock },
      'Completed': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle }
    };

    const { color, icon: Icon } = config[status] || config['Requested'];

    return (
      <Badge className={`${color} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      'High': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Low': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return <Badge className={`${colors[urgency] || colors['Medium']} border`}>{urgency}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading training requests...</div>
      </div>
    );
  }

  const requestedTrainings = trainingRequests.filter(t => t.status === 'Requested');
  const allocatedTrainings = trainingRequests.filter(t => t.status !== 'Requested');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Training Allocation Management</h2>
        <p className="text-gray-300">Review training requests and allocate to trainers</p>
      </div>

      {/* Pending Training Requests */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          Pending Allocation ({requestedTrainings.length})
        </h3>

        {requestedTrainings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending training requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requestedTrainings.map((request) => (
              <div 
                key={request.id}
                className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white">{request.client_name}</h4>
                      {getStatusBadge(request.status)}
                      {getUrgencyBadge(request.urgency)}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <BookOpen className="w-4 h-4" />
                        <span>{request.course_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>{request.number_of_participants} participants</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{request.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User className="w-4 h-4" />
                        <span>{request.contact_person}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Preferred Dates: {request.preferred_dates?.join(', ') || 'Not specified'}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenAllocationDialog(request)}
                    className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 ml-4"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Allocate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Allocated Trainings */}
      {allocatedTrainings.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Allocated Trainings</h3>
          <div className="space-y-3">
            {allocatedTrainings.slice(0, 5).map((training) => (
              <div 
                key={training.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">{training.client_name}</p>
                    {getStatusBadge(training.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {training.course_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {training.trainer_name || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {training.scheduled_dates?.[0] || 'TBD'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allocation Dialog */}
      <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Allocate Training</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Training Details */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-2">{selectedRequest.client_name}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Course:</span>
                    <span className="text-white ml-2">{selectedRequest.course_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Participants:</span>
                    <span className="text-white ml-2">{selectedRequest.number_of_participants}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white ml-2">{selectedRequest.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Urgency:</span>
                    <span className="text-white ml-2">{selectedRequest.urgency}</span>
                  </div>
                </div>
              </div>

              {/* Trainer Selection */}
              <div>
                <Label className="text-gray-400">Select Trainer *</Label>
                <Select value={allocationData.trainer_id} onValueChange={handleTrainerChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue placeholder="Choose a trainer" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/10">
                    {trainers.map(trainer => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name} - {trainer.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Training Dates */}
              <div>
                <Label className="text-gray-400 mb-2 block">Training Dates *</Label>
                {allocationData.scheduled_dates.map((date, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(index, e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    {allocationData.scheduled_dates.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDateField(index)}
                        className="text-red-400"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addDateField}
                  className="border-white/20 text-white mt-1"
                >
                  + Add Another Day
                </Button>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-gray-400">Notes</Label>
                <Textarea
                  value={allocationData.notes}
                  onChange={(e) => setAllocationData({ ...allocationData, notes: e.target.value })}
                  placeholder="Any special instructions for the trainer..."
                  className="bg-white/5 border-white/10 text-white mt-1"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAllocationDialogOpen(false)}
                  disabled={processing}
                  className="border-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAllocate}
                  disabled={processing || !allocationData.trainer_id}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {processing ? 'Allocating...' : 'Allocate Training'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingAllocationManagement;
