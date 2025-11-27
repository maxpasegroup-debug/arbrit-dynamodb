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
        <h2 className="text-2xl font-bold text-slate-900">All Expense Claims (Read-Only)</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded-md p-2 text-sm"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Expense Overview ({filteredClaims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-slate-600">Loading...</p>
          ) : filteredClaims.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No expense claims found</p>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">{claim.employee_name}</h3>
                        {getStatusBadge(claim.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Amount:</span> AED {claim.amount?.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {claim.category}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {claim.department}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{claim.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseReadOnlyView;