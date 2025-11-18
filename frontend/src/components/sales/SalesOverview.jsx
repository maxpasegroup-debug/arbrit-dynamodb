import { useEffect, useState } from 'react';
import { Users, TrendingUp, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SalesOverview = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    assignedLeads: 0,
    pendingLeads: 0,
    closedLeads: 0,
    droppedLeads: 0,
    totalQuotations: 0,
    pendingQuotations: 0,
    activeEmployees: 0,
    totalEmployees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all data in parallel
      const [leadsRes, quotationsRes, employeesRes, attendanceRes] = await Promise.all([
        axios.get(`${API}/sales/leads`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sales/quotations/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/hrm/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/hrm/attendance`, { headers: { Authorization: `Bearer ${token}` } })
      ]).catch(() => [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]);

      const leads = leadsRes.data || [];
      const quotations = quotationsRes.data || [];
      const employees = employeesRes.data || [];
      const attendance = attendanceRes.data || [];

      // Calculate stats
      const salesEmployees = employees.filter(e => 
        e.department === 'Sales' || e.role === 'Tele Sales' || e.role === 'Field Sales'
      );
      
      const today = new Date().toISOString().split('T')[0];
      const activeToday = attendance.filter(a => 
        a.date === today && salesEmployees.some(e => e.id === a.employee_id)
      ).length;

      setStats({
        totalLeads: leads.length,
        assignedLeads: leads.filter(l => l.assigned_to).length,
        pendingLeads: leads.filter(l => l.status === 'In Progress' || l.status === 'Proposal Sent').length,
        closedLeads: leads.filter(l => l.status === 'Closed').length,
        droppedLeads: leads.filter(l => l.status === 'Dropped').length,
        totalQuotations: quotations.length,
        pendingQuotations: quotations.filter(q => q.status === 'Draft' || q.status === 'Pending').length,
        activeEmployees: activeToday,
        totalEmployees: salesEmployees.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Assigned Leads',
      value: stats.assignedLeads,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-400'
    },
    {
      title: 'Pending Follow-ups',
      value: stats.pendingLeads,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400'
    },
    {
      title: 'Closed Deals',
      value: stats.closedLeads,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-400'
    },
    {
      title: 'Total Quotations',
      value: stats.totalQuotations,
      icon: FileText,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-400'
    },
    {
      title: 'Dropped Leads',
      value: stats.droppedLeads,
      icon: XCircle,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-400'
    },
    {
      title: 'Active Team Members',
      value: `${stats.activeEmployees}/${stats.totalEmployees}`,
      icon: Users,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-500/10',
      iconColor: 'text-teal-400'
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Sales Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="p-6 relative z-10">
                <div className={`${card.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                
                <h3 className="text-sm font-medium text-gray-400 mb-2">{card.title}</h3>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SalesOverview;