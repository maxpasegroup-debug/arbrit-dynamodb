import { useState, useEffect } from 'react';
import { User, Award, Clock, TrendingUp, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerPerformance = () => {
  const [trainers, setTrainers] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [trainersRes, trainingsRes] = await Promise.all([
        axios.get(`${API}/hrm/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/academic/training-requests`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const trainersList = (trainersRes.data || []).filter(e => 
        e.designation?.toUpperCase().includes('TRAINER')
      );
      setTrainers(trainersList);
      setTrainings(trainingsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrainerStats = (trainerId) => {
    const trainerTrainings = trainings.filter(t => t.trainer_id === trainerId);
    const completed = trainerTrainings.filter(t => t.status === 'Completed').length;
    const inProgress = trainerTrainings.filter(t => t.status === 'In Progress').length;
    const total = trainerTrainings.length;
    
    return { total, completed, inProgress, rating: 4.5 };
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Trainer Performance</h2>
        <p className="text-gray-300">Monitor trainer activity and performance metrics</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-blue-400" />
            <p className="text-2xl font-bold text-white">{trainers.length}</p>
          </div>
          <p className="text-sm text-gray-400">Total Trainers</p>
        </div>
        
        <div className="bg-slate-900 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-green-400" />
            <p className="text-2xl font-bold text-white">{trainings.filter(t => t.status === 'Completed').length}</p>
          </div>
          <p className="text-sm text-gray-400">Completed Trainings</p>
        </div>
        
        <div className="bg-slate-900 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-yellow-400" />
            <p className="text-2xl font-bold text-white">{trainings.filter(t => t.status === 'In Progress').length}</p>
          </div>
          <p className="text-sm text-gray-400">In Progress</p>
        </div>
      </div>

      <div className="bg-slate-900 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Trainer List</h3>
        {trainers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No trainers found</div>
        ) : (
          <div className="space-y-3">
            {trainers.map((trainer) => {
              const stats = getTrainerStats(trainer.id);
              return (
                <div key={trainer.id} className="bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{trainer.name}</h4>
                      <p className="text-sm text-gray-400">{trainer.designation}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{stats.rating}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Total Trainings</p>
                      <p className="text-lg font-bold text-white">{stats.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Completed</p>
                      <p className="text-lg font-bold text-green-400">{stats.completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">In Progress</p>
                      <p className="text-lg font-bold text-blue-400">{stats.inProgress}</p>
                    </div>
                  </div>
                  
                  {stats.total > 0 && (
                    <div className="mt-3">
                      <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.round((stats.completed / stats.total) * 100)}% completion rate
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerPerformance;