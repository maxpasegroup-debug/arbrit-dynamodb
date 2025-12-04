import { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, DollarSign, Plus, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TargetManagement = () => {
  const [targets, setTargets] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTarget, setNewTarget] = useState({
    employee_id: '',
    month: new Date().toISOString().slice(0, 7),
    revenue_target: '',
    leads_target: '',
    conversion_target: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch targets (will create endpoint if needed)
      try {
        const targetsRes = await axios.get(`${API}/sales-head/targets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTargets(targetsRes.data || []);
      } catch (err) {
        console.log('Targets endpoint not available yet');
        setTargets([]);
      }

      // Fetch team members
      try {
        const teamRes = await axios.get(`${API}/hrm/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const salesTeam = (teamRes.data || []).filter(e => 
          ['Field Sales', 'Tele Sales', 'Sales Employee'].includes(e.designation)
        );
        setTeamMembers(salesTeam);
      } catch (err) {
        console.error('Error fetching team:', err);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetTarget = async () => {
    if (!newTarget.employee_id || !newTarget.revenue_target) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/sales-head/targets`, newTarget, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Target set successfully');
      setDialogOpen(false);
      setNewTarget({
        employee_id: '',
        month: new Date().toISOString().slice(0, 7),
        revenue_target: '',
        leads_target: '',
        conversion_target: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error setting target:', error);
      toast.error('Failed to set target. Feature will be available soon.');
    }
  };

  const calculateProgress = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((achieved / target) * 100), 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading targets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Target Management</h2>
            <p className="text-gray-300">Set and track sales targets for your team</p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set New Target
          </Button>
        </div>
      </div>

      {/* Current Month Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-gray-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue Target</p>
              <p className="text-2xl font-bold text-white">AED 150K</p>
            </div>
          </div>
          <Progress value={65} className="h-2" />
          <p className="text-xs text-gray-400 mt-2">65% achieved</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-gray-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Leads Target</p>
              <p className="text-2xl font-bold text-white">200</p>
            </div>
          </div>
          <Progress value={78} className="h-2" />
          <p className="text-xs text-gray-400 mt-2">78% achieved</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-gray-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Conversion</p>
              <p className="text-2xl font-bold text-white">25%</p>
            </div>
          </div>
          <Progress value={83} className="h-2" />
          <p className="text-xs text-gray-400 mt-2">Target: 30%</p>
        </div>
      </div>

      {/* Team Targets */}
      <div className="bg-white/5 backdrop-blur-sm border border-gray-300 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          Team Targets - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        {targets.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">No targets set for this month</p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="border-indigo-500/30 text-indigo-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Set First Target
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {targets.map((target) => (
              <div 
                key={target.id}
                className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{target.employee_name}</h4>
                    <p className="text-sm text-gray-400">{target.designation}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Revenue Target</p>
                    <p className="text-lg font-bold text-white">AED {target.revenue_target?.toLocaleString()}</p>
                    <Progress 
                      value={calculateProgress(target.revenue_achieved || 0, target.revenue_target)} 
                      className={`h-2 mt-2 ${getProgressColor(calculateProgress(target.revenue_achieved || 0, target.revenue_target))}`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {calculateProgress(target.revenue_achieved || 0, target.revenue_target)}% achieved
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Leads Target</p>
                    <p className="text-lg font-bold text-white">{target.leads_target}</p>
                    <Progress 
                      value={calculateProgress(target.leads_achieved || 0, target.leads_target)} 
                      className={`h-2 mt-2 ${getProgressColor(calculateProgress(target.leads_achieved || 0, target.leads_target))}`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {target.leads_achieved || 0} / {target.leads_target}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Conversion Target</p>
                    <p className="text-lg font-bold text-white">{target.conversion_target}%</p>
                    <Progress 
                      value={target.conversion_achieved || 0} 
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Current: {target.conversion_achieved || 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Target Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Set New Target</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Team Member *</Label>
              <Select value={newTarget.employee_id} onValueChange={(val) => setNewTarget({...newTarget, employee_id: val})}>
                <SelectTrigger className="bg-white/5 border-gray-300 text-white mt-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-300">
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400">Month *</Label>
              <Input
                type="month"
                value={newTarget.month}
                onChange={(e) => setNewTarget({...newTarget, month: e.target.value})}
                className="bg-white/5 border-gray-300 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Revenue Target (AED) *</Label>
                <Input
                  type="number"
                  value={newTarget.revenue_target}
                  onChange={(e) => setNewTarget({...newTarget, revenue_target: e.target.value})}
                  placeholder="50000"
                  className="bg-white/5 border-gray-300 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-400">Leads Target</Label>
                <Input
                  type="number"
                  value={newTarget.leads_target}
                  onChange={(e) => setNewTarget({...newTarget, leads_target: e.target.value})}
                  placeholder="50"
                  className="bg-white/5 border-gray-300 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400">Conversion Target (%)</Label>
              <Input
                type="number"
                value={newTarget.conversion_target}
                onChange={(e) => setNewTarget({...newTarget, conversion_target: e.target.value})}
                placeholder="25"
                min="0"
                max="100"
                className="bg-white/5 border-gray-300 text-white mt-1"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetTarget}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Set Target
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TargetManagement;