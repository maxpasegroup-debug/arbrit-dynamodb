import { useEffect, useState } from 'react';
import { History, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = filter 
        ? `${API}/accounts/audit-logs?entity_type=${filter}&limit=100`
        : `${API}/accounts/audit-logs?limit=100`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      'Created': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Updated': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Deleted': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Approved': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    return colors[action] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <History className="w-7 h-7" />
            Audit Log
          </h2>
          <p className="text-gray-400">Complete trail of all financial changes and activities</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="space-y-2 flex-1">
            <Label className="text-white">Filter by Entity Type</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white max-w-xs">
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                <SelectItem value="">All Activities</SelectItem>
                <SelectItem value="Invoice">Invoices</SelectItem>
                <SelectItem value="Payment">Payments</SelectItem>
                <SelectItem value="ClientAccount">Client Accounts</SelectItem>
                <SelectItem value="Vendor">Vendors</SelectItem>
                <SelectItem value="PettyCash">Petty Cash</SelectItem>
                <SelectItem value="CreditNote">Credit Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-gray-300">Timestamp</TableHead>
              <TableHead className="text-gray-300">Entity Type</TableHead>
              <TableHead className="text-gray-300">Action</TableHead>
              <TableHead className="text-gray-300">Changes</TableHead>
              <TableHead className="text-gray-300">Performed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-white/10">
                  <TableCell className="text-white">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell className="text-white">{log.entity_type}</TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300 max-w-md truncate">
                    {log.changes}
                  </TableCell>
                  <TableCell className="text-gray-300">{log.performed_by_name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && logs.length > 0 && (
        <p className="text-sm text-gray-400 text-center">
          Showing last {logs.length} activities. Use filters to refine results.
        </p>
      )}
    </div>
  );
};

export default AuditLogViewer;