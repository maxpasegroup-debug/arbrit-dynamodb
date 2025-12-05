import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LiveDeliveries = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchLiveTasks();
  }, []);

  const fetchLiveTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTasks = response.data || [];
      // Filter for active deliveries
      const liveTasks = allTasks.filter(task => 
        ['OUT_FOR_DELIVERY', 'PICKUP_READY', 'FAILED', 'RETURNED'].includes(task.status)
      );
      setTasks(liveTasks);
    } catch (error) {
      console.error('Error fetching live deliveries:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OUT_FOR_DELIVERY': return 'bg-blue-500/20 text-blue-400 border-blue-400/50';
      case 'PICKUP_READY': return 'bg-amber-500/20 text-amber-400 border-amber-400/50';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-400/50';
      case 'RETURNED': return 'bg-orange-500/20 text-orange-400 border-orange-400/50';
      default: return 'bg-slate-8000/20 text-gray-400 border-gray-400/50';
    }
  };

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  if (loading) {
    return (
      <Card className="bg-slate-900 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading live deliveries...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white text-xl">Live Deliveries</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Track ongoing and pending deliveries</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="bg-slate-900 border-white/20 text-white w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2f4d] border-white/20">
            <SelectItem value="all" className="text-white hover:bg-white">All Status</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY" className="text-white hover:bg-white">Out for Delivery</SelectItem>
            <SelectItem value="PICKUP_READY" className="text-white hover:bg-white">Pickup Ready</SelectItem>
            <SelectItem value="FAILED" className="text-white hover:bg-white">Failed</SelectItem>
            <SelectItem value="RETURNED" className="text-white hover:bg-white">Returned</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No active deliveries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="bg-slate-900 border-white/10 hover:bg-white transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{task.client_name}</h4>
                      <p className="text-sm text-gray-400">{task.client_branch}</p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Assigned To</p>
                      <p className="text-white">{task.assigned_to_employee_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Updated</p>
                      <p className="text-white">{new Date(task.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {task.remarks && (
                    <div className="mt-3 p-2 bg-slate-900 rounded text-sm text-gray-300">
                      <p className="text-xs text-gray-400">Remarks:</p>
                      <p>{task.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveDeliveries;
