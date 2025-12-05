import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Clock, CheckCircle2, XCircle } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const MyLeadsTracker = () => {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyLeads();
  }, []);

  const fetchMyLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await axios.get(`${API}/sales/my-leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const leads = response.data || [];
      
      // Calculate stats
      const total = leads.length;
      const newLeads = leads.filter(l => l.status === 'New').length;
      const inProgress = leads.filter(l => ['Follow Up', 'Contacted', 'Proposal Sent'].includes(l.status)).length;
      const converted = leads.filter(l => l.status === 'Closed').length;
      const lost = leads.filter(l => l.status === 'Lost').length;
      const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

      setStats({ total, new: newLeads, inProgress, converted, lost, conversionRate });
      setRecentLeads(leads.slice(0, 5)); // Show last 5 leads
      setLoading(false);
    } catch (error) {
      console.error('Error fetching my leads:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'New': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Follow Up': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Contacted': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Proposal Sent': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Closed': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Lost': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return <Badge className={`${statusColors[status] || ''} border`}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <p className="text-gray-400">Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-blue-300">Total Leads</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-yellow-300">In Progress</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-300">Converted</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.converted}</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-red-300">Lost</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.lost}</p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-300">Conversion</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">My Recent Leads</h3>
        </div>
        <div className="p-6">
          {recentLeads.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No leads yet. Start adding leads!</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="bg-slate-900 border border-white/20 rounded-lg p-4 hover:bg-white transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{lead.client_name}</h4>
                        {getStatusBadge(lead.status)}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{lead.requirement}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Source: {lead.source}</span>
                        {lead.created_at && (
                          <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLeadsTracker;
