import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssignmentBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-slate-8000/20 text-gray-400 border-gray-400/50';
      case 'PICKUP_READY': return 'bg-amber-500/20 text-amber-400 border-amber-400/50';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400 border-blue-400/50';
      case 'DELIVERED': return 'bg-green-500/20 text-green-400 border-green-400/50';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-400/50';
      case 'RETURNED': return 'bg-orange-500/20 text-orange-400 border-orange-400/50';
      default: return 'bg-slate-8000/20 text-gray-400 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-xl">Assignment Board</CardTitle>
        <p className="text-sm text-gray-400 mt-1">All delivery task assignments</p>
      </CardHeader>
      <CardContent className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No delivery tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="bg-slate-900 border-white/10 hover:bg-white transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{task.client_name}</h4>
                      <p className="text-sm text-gray-400">{task.client_branch}</p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Assigned To</p>
                      <p className="text-white">{task.assigned_to_employee_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Created</p>
                      <p className="text-white">{new Date(task.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Due Date</p>
                      <p className="text-white">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentBoard;
