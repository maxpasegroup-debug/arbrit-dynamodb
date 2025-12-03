import { useEffect, useState } from 'react';
import { BookOpen, User, Calendar, MapPin, CheckCircle, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcademicTrainingBoard = () => {
  const [trainings, setTrainings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocateModal, setAllocateModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [allocationData, setAllocationData] = useState({
    trainer_id: '',
    trainer_name: '',
    scheduled_dates: ['', ''],
    training_days: 2,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const [trainingsRes, trainersRes] = await Promise.all([
        axios.get(`${API}/academic/training-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/hrm/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setTrainings(trainingsRes.data);
      const trainersList = trainersRes.data.filter(e => 
        e.designation?.includes('Trainer') || e.role?.includes('Trainer')
      );
      setTrainers(trainersList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = (training) => {
    setSelectedTraining(training);
    setAllocationData({
      trainer_id: '',
      trainer_name: '',
      scheduled_dates: training.preferred_dates.slice(0, 2),
      training_days: 2,
      notes: ''
    });
    setAllocateModal(true);
  };

  const submitAllocation = async () => {
    if (!allocationData.trainer_id || !allocationData.trainer_name) {
      toast.error('Please select a trainer');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/academic/training-requests/${selectedTraining.id}/allocate`,
        allocationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Training allocated successfully!');
      setAllocateModal(false);
      fetchData();
    } catch (error) {
      console.error('Error allocating training:', error);
      toast.error('Failed to allocate training');
    }
  };

  const pending = trainings.filter(t => t.status === 'Requested');
  const active = trainings.filter(t => ['Allocated', 'Confirmed', 'In Progress'].includes(t.status));
  const completed = trainings.filter(t => t.status === 'Completed');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-yellow-300 text-sm">🟡 NEW</p>
              <p className="text-4xl font-bold text-white">{pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-blue-300 text-sm">🔵 ACTIVE</p>
              <p className="text-4xl font-bold text-white">{active.length}</p>
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
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-purple-300 text-sm">📊 TOTAL</p>
              <p className="text-4xl font-bold text-white">{trainings.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">📋 Pending Allocation ({pending.length})</h3>
          {pending.map(training => (
            <Card key={training.id} className="bg-white/5 border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{training.client_name}</h4>
                    <p className="text-purple-300 text-lg">{training.course_name} • {training.number_of_participants} Participants</p>
                    <p className="text-slate-400 mt-2">Requested by: {training.requested_by_name}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {training.preferred_dates.join(' or ')}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4" />
                        {training.location}
                      </div>
                      <Badge className={training.urgency === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}>
                        {training.urgency} Urgency
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAllocate(training)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Allocate Trainer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">🔵 Active Trainings ({active.length})</h3>
          {active.map(training => (
            <Card key={training.id} className="bg-white/5 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white">{training.client_name} • {training.course_name}</h4>
                    <div className="mt-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                            style={{ width: `${training.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">{training.progress_percentage}%</span>
                      </div>
                      <p className="text-slate-400 text-sm">{training.progress_stage}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-blue-300">
                      <User className="w-4 h-4" />
                      Trainer: {training.trainer_name} • {training.number_of_participants} Participants
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={allocateModal} onOpenChange={setAllocateModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Allocate Trainer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white">Select Trainer *</Label>
              <select
                value={allocationData.trainer_id}
                onChange={(e) => {
                  const trainer = trainers.find(t => t.id === e.target.value);
                  setAllocationData({
                    ...allocationData,
                    trainer_id: e.target.value,
                    trainer_name: trainer?.name || ''
                  });
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-md text-white"
              >
                <option value="">Select Trainer</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} - {trainer.designation || 'Trainer'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Start Date</Label>
                <Input
                  type="date"
                  value={allocationData.scheduled_dates[0]}
                  onChange={(e) => {
                    const newDates = [...allocationData.scheduled_dates];
                    newDates[0] = e.target.value;
                    setAllocationData({...allocationData, scheduled_dates: newDates});
                  }}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Number of Days</Label>
                <Input
                  type="number"
                  value={allocationData.training_days}
                  onChange={(e) => setAllocationData({...allocationData, training_days: parseInt(e.target.value)})}
                  className="bg-slate-800 border-white/10 text-white"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label className="text-white">Notes</Label>
              <textarea
                value={allocationData.notes}
                onChange={(e) => setAllocationData({...allocationData, notes: e.target.value})}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-md text-white min-h-[80px]"
                placeholder="Any special instructions..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setAllocateModal(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={submitAllocation}
                className="bg-green-600 hover:bg-green-700"
              >
                Allocate Training
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicTrainingBoard;