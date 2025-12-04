import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyTasksHistory = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTasks = response.data || [];
      const completedTasks = allTasks.filter(task => 
        ['DELIVERED', 'FAILED', 'RETURNED'].includes(task.status)
      );
      setTasks(completedTasks);
    } catch (error) {
      console.error('Error fetching history:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-500/20 text-green-400 border-green-400/50';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-400/50';
      case 'RETURNED': return 'bg-orange-500/20 text-orange-400 border-orange-400/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-white text-xl">Task History</CardTitle>
        <p className="text-sm text-gray-400 mt-1">Your completed delivery tasks</p>
      </CardHeader>
      <CardContent className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No completed tasks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{task.client_name}</h4>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Branch</p>
                      <p className="text-white">{task.client_branch}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Completed</p>
                      <p className="text-white">
                        {task.delivered_at ? new Date(task.delivered_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Updated</p>
                      <p className="text-white">{new Date(task.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {task.remarks && (
                    <div className="mt-3 p-2 bg-white rounded text-sm">
                      <p className="text-xs text-gray-400">Notes:</p>
                      <p className="text-gray-300">{task.remarks}</p>
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

export default MyTasksHistory;
