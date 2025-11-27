import { useState, useEffect } from 'react';
import { Eye, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExpenseReadOnlyView = () => {
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAllClaims();
  }, []);

  const fetchAllClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch from all endpoints and merge
      const [forApproval, hrReview, accountsReview] = await Promise.all([
        axios.get(`${API}/expenses/for-approval`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API}/expenses/hr-review`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API}/expenses/accounts-review`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);

      const merged = [...forApproval.data, ...hrReview.data, ...accountsReview.data];
      // Remove duplicates by id
      const unique = merged.filter((claim, index, self) => 
        index === self.findIndex(c => c.id === claim.id)
      );
      
      setAllClaims(unique);
    } catch (error) {
      console.error('Error fetching claims:', error);
      // Silent fail - no toast error
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING_DEPT_HEAD': { color: 'bg-yellow-500/20 text-yellow-600 border-yellow-400/50', label: 'Pending Dept Head' },
      'PENDING_HR': { color: 'bg-blue-500/20 text-blue-600 border-blue-400/50', label: 'Pending HR' },
      'PENDING_ACCOUNTS': { color: 'bg-purple-500/20 text-purple-600 border-purple-400/50', label: 'Pending Accounts' },
      'PAID': { color: 'bg-green-500/20 text-green-600 border-green-400/50', label: 'Paid' },
      'REJECTED': { color: 'bg-red-500/20 text-red-600 border-red-400/50', label: 'Rejected' }
    };
    return <Badge className={statusConfig[status]?.color || ''}>{statusConfig[status]?.label || status}</Badge>;
  };

  const filteredClaims = filter === 'all' 
    ? allClaims 
    : allClaims.filter(c => c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">All Expense Claims (Read-Only)</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white rounded-md p-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="PENDING_DEPT_HEAD">Pending Dept Head</option>
            <option value="PENDING_HR">Pending HR</option>
            <option value="PENDING_ACCOUNTS">Pending Accounts</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 bg-white/5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Expense Overview ({filteredClaims.length})
          </h3>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-center py-8 text-gray-400">Loading...</p>
          ) : filteredClaims.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No expense claims found</p>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-white text-lg">{claim.employee_name}</h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400 font-medium">Amount:</span>
                          <span className="text-green-400 ml-2 font-semibold">AED {claim.amount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Category:</span>
                          <span className="text-white ml-2">{claim.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Department:</span>
                          <span className="text-white ml-2">{claim.department}</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
                        <p className="text-sm text-gray-400">Description:</p>
                        <p className="text-white mt-1">{claim.description}</p>
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

export default ExpenseReadOnlyView;