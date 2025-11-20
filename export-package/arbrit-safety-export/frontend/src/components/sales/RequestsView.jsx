import { useEffect, useState } from 'react';
import { GraduationCap, DollarSign, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RequestsView = () => {
  const [trainerRequests, setTrainerRequests] = useState([]);
  const [invoiceRequests, setInvoiceRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('trainer');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      // For Sales Head, we'd need endpoints to get all requests, not just own
      // Using the same endpoints for now - would need backend enhancement
      const [trainerRes, invoiceRes] = await Promise.all([
        axios.get(`${API}/sales/trainer-requests`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API}/sales/invoice-requests`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      
      setTrainerRequests(trainerRes.data || []);
      setInvoiceRequests(invoiceRes.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Silent fail - no toast on empty data
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Processed': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger 
            value="trainer"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Trainer Requests ({trainerRequests.length})
          </TabsTrigger>
          <TabsTrigger 
            value="invoice"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-300"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Invoice Requests ({invoiceRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trainer" className="mt-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">Client Name</TableHead>
                  <TableHead className="text-gray-300">Course Type</TableHead>
                  <TableHead className="text-gray-300">Preferred Date</TableHead>
                  <TableHead className="text-gray-300">Location</TableHead>
                  <TableHead className="text-gray-300">Requested By</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainerRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No trainer requests
                    </TableCell>
                  </TableRow>
                ) : (
                  trainerRequests.map((req) => (
                    <TableRow key={req.id} className="border-white/10">
                      <TableCell className="text-white font-medium">{req.client_name}</TableCell>
                      <TableCell className="text-gray-300">{req.course_type || req.course}</TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {req.preferred_date ? new Date(req.preferred_date).toLocaleDateString() : req.preferred_dates}
                      </TableCell>
                      <TableCell className="text-gray-300">{req.location || req.branch}</TableCell>
                      <TableCell className="text-gray-300 text-sm">{req.requested_by_name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invoice" className="mt-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-300">Client Name</TableHead>
                  <TableHead className="text-gray-300">Quotation Ref</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Requested By</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                      No invoice requests
                    </TableCell>
                  </TableRow>
                ) : (
                  invoiceRequests.map((req) => (
                    <TableRow key={req.id} className="border-white/10">
                      <TableCell className="text-white font-medium">{req.client_name}</TableCell>
                      <TableCell className="text-gray-300">{req.quotation_ref || req.quotation_id || '-'}</TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          {parseFloat(req.amount || req.initial_amount || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">{req.requested_by_name}</TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RequestsView;