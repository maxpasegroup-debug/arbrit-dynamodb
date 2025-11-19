import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ClipboardList, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyTasksToday = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState(undefined);
  const [deliveredTo, setDeliveredTo] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTasks = response.data || [];
      // Filter for today's/pending tasks
      const activeTasks = allTasks.filter(task => 
        !['DELIVERED', 'FAILED', 'RETURNED'].includes(task.status)
      );
      setTasks(activeTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setRemarks(task.remarks || '');
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    if (newStatus === 'DELIVERED' && !deliveredTo) {
      toast.error('Please enter who received the delivery');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        status: newStatus,
        remarks: remarks || undefined
      };

      if (newStatus === 'DELIVERED') {
        updateData.delivered_at = new Date().toISOString();
        updateData.remarks = `Delivered to: ${deliveredTo}. ${remarks || ''}`;
      }

      await axios.put(
        `${API}/dispatch/my-tasks/${selectedTask.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Task updated successfully');
      setShowUpdateModal(false);
      setSelectedTask(null);
      setNewStatus(undefined);
      setDeliveredTo('');
      setRemarks('');
      fetchMyTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
      case 'PICKUP_READY': return 'bg-amber-500/20 text-amber-400 border-amber-400/50';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400 border-blue-400/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading tasks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">My Tasks Today</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Pending and active delivery tasks</p>
        </CardHeader>
        <CardContent className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No active tasks</p>
              <p className="text-sm text-gray-500 mt-2">New assignments will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{task.client_name}</h3>
                        <p className="text-sm text-gray-400">{task.client_branch}</p>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      {task.delivery_address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Location</p>
                            <p className="text-white">{task.delivery_address}</p>
                          </div>
                        </div>
                      )}
                      {task.contact_person && (
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Contact</p>
                            <p className="text-white">{task.contact_person}</p>
                          </div>
                        </div>
                      )}
                      {task.contact_mobile && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-400">Phone</p>
                            <p className="text-white">{task.contact_mobile}</p>
                          </div>
                        </div>
                      )}
                      {task.due_date && (
                        <div>
                          <p className="text-xs text-gray-400">Due Date</p>
                          <p className="text-white">{new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {task.remarks && (
                      <div className="mb-3 p-2 bg-white/5 rounded text-sm">
                        <p className="text-xs text-gray-400">Instructions:</p>
                        <p className="text-gray-300">{task.remarks}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => handleUpdateStatus(task)}
                      className="w-full bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
                    >
                      Update Status
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Update Delivery Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Client</Label>
              <p className="text-white mt-1">{selectedTask?.client_name}</p>
            </div>
            <div>
              <Label className="text-gray-300">Update Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20">
                  <SelectItem value="PICKUP_READY" className="text-white hover:bg-white/10">Pickup Ready</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY" className="text-white hover:bg-white/10">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED" className="text-white hover:bg-white/10">Delivered</SelectItem>
                  <SelectItem value="FAILED" className="text-white hover:bg-white/10">Failed</SelectItem>
                  <SelectItem value="RETURNED" className="text-white hover:bg-white/10">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'DELIVERED' && (
              <div>
                <Label className="text-gray-300">Delivered To (Name)</Label>
                <Input
                  value={deliveredTo}
                  onChange={(e) => setDeliveredTo(e.target.value)}
                  className="bg-white/5 border-white/20 text-white mt-2"
                  placeholder="Enter recipient name"
                />
              </div>
            )}
            <div>
              <Label className="text-gray-300">Remarks / Notes</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUpdate}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              Save Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyTasksToday;
