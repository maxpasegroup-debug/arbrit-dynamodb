import { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Users, Plus, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TargetManagement = () => {
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [targetPeriod, setTargetPeriod] = useState('monthly');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetLeads, setTargetLeads] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchTargets();
    fetchEmployees();
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales-head/targets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTargets(response.data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      // Silent fail - targets might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const salesEmployees = response.data.filter(emp => 
        emp.department === 'Sales' || 
        emp.designation?.includes('SALES') ||
        emp.role?.includes('Sales')
      );
      setEmployees(salesEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateTarget = async () => {
    if (!selectedEmployee || !targetAmount || !startDate || !endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales-head/targets`, {
        employee_id: selectedEmployee,
        period: targetPeriod,
        target_amount: parseFloat(targetAmount),
        target_leads: parseInt(targetLeads) || 0,
        start_date: startDate,
        end_date: endDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Target created successfully');
      setTargetDialogOpen(false);
      resetForm();
      fetchTargets();
    } catch (error) {
      console.error('Error creating target:', error);
      toast.error('Failed to create target');
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setTargetAmount('');
    setTargetLeads('');
    setStartDate('');
    setEndDate('');
  };

  const calculateAchievement = (target) => {
    const achieved = target.achieved_amount || 0;
    const targetAmt = target.target_amount || 1;
    return Math.round((achieved / targetAmt) * 100);
  };

  const getAchievementColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500/20 text-green-300 border-green-500/50';
    if (percentage >= 75) return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    if (percentage >= 50) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    return 'bg-red-500/20 text-red-300 border-red-500/50';
  };

  const groupedTargets = targets.reduce((acc, target) => {
    if (!acc[target.period]) acc[target.period] = [];
    acc[target.period].push(target);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 Sales Target Management</h2>
          <p className="text-sm text-slate-400">Set and track performance targets for your team</p>
        </div>
        <Button
          onClick={() => setTargetDialogOpen(true)}
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
          className="text-[#0a1e3d]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Set New Target
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-300">Active Targets</p>
              <p className="text-2xl font-bold text-white">{targets.filter(t => t.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-300">Achieved</p>
              <p className="text-2xl font-bold text-white">
                {targets.filter(t => calculateAchievement(t) >= 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-300">In Progress</p>
              <p className="text-2xl font-bold text-white">
                {targets.filter(t => {
                  const pct = calculateAchievement(t);
                  return pct > 0 && pct < 100;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-300">Below Target</p>
              <p className="text-2xl font-bold text-white">
                {targets.filter(t => calculateAchievement(t) < 50 && t.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Targets by Period */}
      {['monthly', 'quarterly', 'yearly'].map(period => (
        groupedTargets[period] && groupedTargets[period].length > 0 && (
          <div key={period} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 capitalize flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {period} Targets
            </h3>
            
            <div className="space-y-4">
              {groupedTargets[period].map(target => {
                const achievement = calculateAchievement(target);
                
                return (
                  <div key={target.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{target.employee_name}</h4>
                        <p className="text-sm text-slate-400">
                          {new Date(target.start_date).toLocaleDateString()} - {new Date(target.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getAchievementColor(achievement)}>
                        {achievement}% Complete
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-400">Target Amount</p>
                        <p className="text-sm text-white font-semibold">{target.target_amount} AED</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Achieved</p>
                        <p className="text-sm text-white font-semibold">{target.achieved_amount || 0} AED</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Target Leads</p>
                        <p className="text-sm text-white">{target.achieved_leads || 0} / {target.target_leads}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          achievement >= 100 ? 'bg-green-500' :
                          achievement >= 75 ? 'bg-blue-500' :
                          achievement >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(achievement, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}

      {targets.length === 0 && !loading && (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No targets set yet</p>
          <Button
            onClick={() => setTargetDialogOpen(true)}
            style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
            className="text-[#0a1e3d]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set First Target
          </Button>
        </div>
      )}

      {/* Create Target Dialog */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Set New Target</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Employee *</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Period *</label>
              <Select value={targetPeriod} onValueChange={setTargetPeriod}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Target Amount (AED) *</label>
                <Input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="50000"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Target Leads</label>
                <Input
                  type="number"
                  value={targetLeads}
                  onChange={(e) => setTargetLeads(e.target.value)}
                  placeholder="10"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Start Date *</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">End Date *</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTargetDialogOpen(false);
                resetForm();
              }}
              className="border-white/20 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTarget}
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }}
              className="text-[#0a1e3d]"
            >
              Create Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TargetManagement;
