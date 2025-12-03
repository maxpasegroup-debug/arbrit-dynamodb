import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MapPin, Award, Search, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PerformanceOverview = () => {
  const [analytics, setAnalytics] = useState({
    totalLeads: 0,
    totalRevenue: 0,
    teamMembers: 0,
    conversionRate: 0,
    monthlyTarget: 500000,
    monthlyAchieved: 0
  });
  const [filters, setFilters] = useState({
    area: '',
    badge: '',
    individual: '',
    timeRange: 'current_month'
  });
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [areaPerformance, setAreaPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/sales-head/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      setAnalytics(response.data?.overview || {});
      setTeamPerformance(response.data?.team || []);
      setAreaPerformance(response.data?.areas || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data
      setAnalytics({
        totalLeads: 156,
        totalRevenue: 423000,
        teamMembers: 12,
        conversionRate: 68,
        monthlyTarget: 500000,
        monthlyAchieved: 423000
      });
      setTeamPerformance([
        { id: 1, name: 'Ahmed Hassan', role: 'Field Sales', leads: 25, revenue: 85000, conversion: 72, badge: 'Gold' },
        { id: 2, name: 'Sarah Ali', role: 'Tele Sales', leads: 35, revenue: 92000, conversion: 68, badge: 'Gold' },
        { id: 3, name: 'Mohammed Ahmed', role: 'Sales Employee', leads: 18, revenue: 54000, conversion: 65, badge: 'Silver' },
        { id: 4, name: 'Fatima Omar', role: 'Field Sales', leads: 22, revenue: 67000, conversion: 70, badge: 'Silver' },
        { id: 5, name: 'Ali Hassan', role: 'Tele Sales', leads: 28, revenue: 78000, conversion: 74, badge: 'Gold' }
      ]);
      setAreaPerformance([
        { area: 'Dubai', leads: 78, revenue: 245000, members: 5 },
        { area: 'Abu Dhabi', leads: 45, revenue: 156000, members: 3 },
        { area: 'Sharjah', leads: 33, revenue: 98000, members: 4 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'Silver': return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
      case 'Bronze': return 'bg-orange-600/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-400/30';
    }
  };

  const achievementPercentage = (analytics.monthlyAchieved / analytics.monthlyTarget) * 100;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Performance Analytics
          </h3>
          <p className="text-slate-400">
            Comprehensive team performance analysis and insights
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Custom Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-300">Area</Label>
              <Select value={filters.area} onValueChange={(value) => setFilters({...filters, area: value})}>
                <SelectTrigger className="bg-slate-800 border-white/10 text-slate-100">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="">All Areas</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Ajman">Ajman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Badge Level</Label>
              <Select value={filters.badge} onValueChange={(value) => setFilters({...filters, badge: value})}>
                <SelectTrigger className="bg-slate-800 border-white/10 text-slate-100">
                  <SelectValue placeholder="All Badges" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="">All Badges</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Individual</Label>
              <Input
                value={filters.individual}
                onChange={(e) => setFilters({...filters, individual: e.target.value})}
                placeholder="Search by name..."
                className="bg-slate-800 border-white/10 text-slate-100"
              />
            </div>

            <div>
              <Label className="text-slate-300">Time Range</Label>
              <Select value={filters.timeRange} onValueChange={(value) => setFilters({...filters, timeRange: value})}>
                <SelectTrigger className="bg-slate-800 border-white/10 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-500/10 border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-blue-400 font-semibold">Total Leads</p>
                <p className="text-2xl font-bold text-blue-300">{analytics.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-green-400 font-semibold">Total Revenue</p>
                <p className="text-2xl font-bold text-green-300">{analytics.totalRevenue.toLocaleString()} AED</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-purple-400 font-semibold">Team Members</p>
                <p className="text-2xl font-bold text-purple-300">{analytics.teamMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/10 border-orange-400/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-orange-400 font-semibold">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-300">{analytics.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Target Progress */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Monthly Target Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-300">{achievementPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={achievementPercentage} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Achieved: {analytics.monthlyAchieved.toLocaleString()} AED</span>
            <span className="text-slate-400">Target: {analytics.monthlyTarget.toLocaleString()} AED</span>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Individual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamPerformance.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-slate-400 text-sm">{member.role}</p>
                  </div>
                  <Badge className={getBadgeColor(member.badge)}>
                    <Award className="w-3 h-3 mr-1" />
                    {member.badge}
                  </Badge>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-slate-400">Leads</p>
                    <p className="text-white font-semibold">{member.leads}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400">Revenue</p>
                    <p className="text-white font-semibold">{member.revenue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400">Conversion</p>
                    <p className="text-white font-semibold">{member.conversion}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Area Performance */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Area-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {areaPerformance.map((area, index) => (
              <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-semibold">{area.area}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Leads:</span>
                    <span className="text-white">{area.leads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue:</span>
                    <span className="text-white">{area.revenue.toLocaleString()} AED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Team Size:</span>
                    <span className="text-white">{area.members}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview;