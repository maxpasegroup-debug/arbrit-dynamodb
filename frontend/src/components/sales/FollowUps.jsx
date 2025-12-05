import { useEffect, useState } from 'react';
import { Calendar, Phone, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FollowUps = () => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/my-leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter leads that are In Progress or Proposal Sent
      const pendingLeads = response.data.filter(lead => 
        lead.status === 'In Progress' || lead.status === 'Proposal Sent'
      );
      setFollowUps(pendingLeads);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (status) => {
    if (status === 'Proposal Sent') return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          Follow-ups Required ({followUps.length})
        </h3>
      </div>

      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-gray-300">Client</TableHead>
              <TableHead className="text-gray-300">Contact</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Requirement</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Loading follow-ups...
                </TableCell>
              </TableRow>
            ) : followUps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p>No pending follow-ups! Great job!</p>
                </TableCell>
              </TableRow>
            ) : (
              followUps.map((lead) => (
                <TableRow key={lead.id} className="border-white/20">
                  <TableCell className="text-white font-medium">{lead.client_name}</TableCell>
                  <TableCell className="text-gray-300">
                    {lead.mobile && (
                      <div className="text-sm">{lead.mobile}</div>
                    )}
                    {lead.email && (
                      <div className="text-xs text-gray-400">{lead.email}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(lead.status)}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm max-w-xs truncate">
                    {lead.requirement}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {lead.mobile && (
                        <>
                          <a href={`tel:${lead.mobile}`}>
                            <Phone className="w-5 h-5 text-green-400 hover:text-green-300 cursor-pointer" />
                          </a>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FollowUps;