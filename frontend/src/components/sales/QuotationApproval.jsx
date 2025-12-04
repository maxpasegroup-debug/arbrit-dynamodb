import { useEffect, useState } from 'react';
import { FileText, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationApproval = () => {
  const [quotations, setQuotations] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/quotations/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotations(response.data || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      // Silent fail - no toast on empty data
    }
  };

  const handleAction = (quotation, action) => {
    setSelectedQuotation(quotation);
    setActionType(action);
    setRemarks('');
    setShowDialog(true);
  };

  const submitAction = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales/quotations/${selectedQuotation.id}/approve`,
        { approved: actionType === 'approve', remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Quotation ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowDialog(false);
      fetchQuotations();
    } catch (error) {
      console.error('Error processing quotation:', error);
      toast.error('Failed to process quotation');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Sent': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return colors[status] || colors['Draft'];
  };

  const pendingQuotations = quotations.filter(q => q.status === 'Pending' || q.status === 'Draft');
  const processedQuotations = quotations.filter(q => q.status !== 'Pending' && q.status !== 'Draft');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-yellow-400" />
          Pending Approvals ({pendingQuotations.length})
        </h3>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-300">
                <TableHead className="text-gray-300">Client Name</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Created By</TableHead>
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No pending quotations
                  </TableCell>
                </TableRow>
              ) : (
                pendingQuotations.map((quot) => (
                  <TableRow key={quot.id} className="border-gray-300">
                    <TableCell className="text-white font-medium">{quot.client_name}</TableCell>
                    <TableCell className="text-gray-300">${parseFloat(quot.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{quot.created_by_name || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {quot.created_at ? new Date(quot.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quot.status)}>{quot.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(quot, 'approve')}
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:bg-green-500/10"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleAction(quot, 'reject')}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Processed Quotations ({processedQuotations.length})</h3>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-300">
                <TableHead className="text-gray-300">Client Name</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Created By</TableHead>
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    No processed quotations
                  </TableCell>
                </TableRow>
              ) : (
                processedQuotations.map((quot) => (
                  <TableRow key={quot.id} className="border-gray-300">
                    <TableCell className="text-white font-medium">{quot.client_name}</TableCell>
                    <TableCell className="text-gray-300">${parseFloat(quot.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{quot.created_by_name || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300 text-sm">
                      {quot.created_at ? new Date(quot.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quot.status)}>{quot.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Quotation' : 'Reject Quotation'}
            </DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Client:</span>
                  <span className="font-semibold">{selectedQuotation.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-semibold">${parseFloat(selectedQuotation.total_amount || 0).toLocaleString()}</span>
                </div>
                {selectedQuotation.items && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <span className="text-gray-400 text-sm">Items:</span>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedQuotation.items}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Remarks (optional)</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Add any comments..."
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              style={{ 
                background: actionType === 'approve' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              }}
              className="text-white"
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationApproval;