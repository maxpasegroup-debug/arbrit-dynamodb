import { useEffect, useState } from 'react';
import { Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DeletionApprovals = () => {
  const [pendingDeletions, setPendingDeletions] = useState({ quotations: [], invoices: [], total_pending: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingDeletions();
  }, []);

  const fetchPendingDeletions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/executive/pending-deletions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingDeletions(response.data);
    } catch (error) {
      console.error('Error fetching pending deletions:', error);
    }
  };

  const handleAction = (item, type, action) => {
    setSelectedItem({ ...item, type });
    setActionType(action);
    setRemarks('');
    setShowDialog(true);
  };

  const submitAction = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/executive/approve-deletion?item_type=${selectedItem.type}&item_id=${selectedItem.id}`,
        {
          approved: actionType === 'approve',
          remarks: remarks || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(
        actionType === 'approve' 
          ? `${selectedItem.type === 'quotation' ? 'Quotation' : 'Invoice'} deleted successfully`
          : `Deletion rejected, item restored to Draft`
      );
      
      setShowDialog(false);
      fetchPendingDeletions();
    } catch (error) {
      console.error('Error processing deletion:', error);
      toast.error(error.response?.data?.detail || 'Failed to process deletion');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Deletion Approvals</h3>
            <p className="text-sm text-gray-400">Review and approve deletion requests from team</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30 px-4 py-2 text-lg">
          {pendingDeletions.total_pending} Pending
        </Badge>
      </div>

      {pendingDeletions.total_pending === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-green-500/20 rounded-full">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-lg text-gray-300">No pending deletion requests</p>
            <p className="text-sm text-gray-500">All deletion requests have been processed</p>
          </div>
        </div>
      ) : (
        <>
          {/* Quotations Pending Deletion */}
          {pendingDeletions.quotations.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Quotations Pending Deletion ({pendingDeletions.quotations.length})
                </h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Client Name</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Created By</TableHead>
                    <TableHead className="text-gray-300">Requested By</TableHead>
                    <TableHead className="text-gray-300">Request Date</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDeletions.quotations.map((quot) => (
                    <TableRow key={quot.id} className="border-white/10">
                      <TableCell className="text-white font-medium">{quot.client_name}</TableCell>
                      <TableCell className="text-white">AED {quot.total_amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-300">{quot.created_by_name}</TableCell>
                      <TableCell className="text-gray-300">{quot.deletion_requested_by_name}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(quot.deletion_requested_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(quot, 'quotation', 'approve')}
                            className="bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(quot, 'quotation', 'reject')}
                            className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Invoices Pending Deletion */}
          {pendingDeletions.invoices.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Invoices Pending Deletion ({pendingDeletions.invoices.length})
                </h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-gray-300">Invoice Number</TableHead>
                    <TableHead className="text-gray-300">Client Name</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Requested By</TableHead>
                    <TableHead className="text-gray-300">Request Date</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDeletions.invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-white/10">
                      <TableCell className="text-white font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-white">{invoice.client_name}</TableCell>
                      <TableCell className="text-white">AED {invoice.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-300">{invoice.deletion_requested_by_name}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(invoice.deletion_requested_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(invoice, 'invoice', 'approve')}
                            className="bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(invoice, 'invoice', 'reject')}
                            className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionType === 'approve' ? 'Confirm Deletion' : 'Reject Deletion'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve'
                ? `Are you sure you want to permanently delete this ${selectedItem?.type}? This action cannot be undone.`
                : `Rejecting this deletion request will restore the ${selectedItem?.type} to Draft status.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">
                {selectedItem?.type === 'quotation' ? 'Client' : 'Invoice'}: 
                <span className="text-white font-medium ml-2">
                  {selectedItem?.type === 'quotation' ? selectedItem?.client_name : `${selectedItem?.invoice_number} - ${selectedItem?.client_name}`}
                </span>
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Requested by: <span className="text-white">{selectedItem?.deletion_requested_by_name}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any comments..."
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              disabled={loading}
              className={actionType === 'approve' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
            >
              {loading ? 'Processing...' : actionType === 'approve' ? 'Confirm Delete' : 'Reject & Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeletionApprovals;
