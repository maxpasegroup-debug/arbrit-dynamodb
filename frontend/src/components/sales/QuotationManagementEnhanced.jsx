import { useEffect, useState } from 'react';
import { FileText, Edit, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuotationManagementEnhanced = () => {
  const [quotations, setQuotations] = useState([]);
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [actionType, setActionType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    items: '',
    total_amount: '',
    remarks: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
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
    }
  };

  const handleEdit = (quotation) => {
    setSelectedQuotation(quotation);
    setFormData({
      client_name: quotation.client_name || '',
      items: quotation.items || '',
      total_amount: quotation.total_amount || '',
      remarks: quotation.remarks || ''
    });
    setShowEditDialog(true);
  };

  const submitEdit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales-head/quotations/${selectedQuotation.id}`,
        {
          ...formData,
          total_amount: parseFloat(formData.total_amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Quotation updated successfully');
      setShowEditDialog(false);
      fetchQuotations();
    } catch (error) {
      console.error('Error updating quotation:', error);
      toast.error(error.response?.data?.detail || 'Failed to update quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (quotation) => {
    setSelectedQuotation(quotation);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API}/sales-head/quotations/${selectedQuotation.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.immediate) {
        toast.success('Quotation deleted successfully');
      } else {
        toast.success('Deletion request submitted to COO/MD for approval');
      }
      
      setShowDeleteDialog(false);
      fetchQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (quotation, action) => {
    setSelectedQuotation(quotation);
    setActionType(action);
    setRemarks('');
    setShowApproveDialog(true);
  };

  const submitApproval = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/sales/quotations/${selectedQuotation.id}/approve`,
        { approved: actionType === 'approve', remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Quotation ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowApproveDialog(false);
      fetchQuotations();
    } catch (error) {
      console.error('Error processing quotation:', error);
      toast.error('Failed to process quotation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-slate-8000/20 text-gray-300 border-gray-500/30',
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Pending Deletion': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };
    return colors[status] || colors['Draft'];
  };

  const canEdit = (quot) => {
    return ['Sales Head', 'COO', 'MD', 'CEO'].includes(user?.role);
  };

  const canDelete = (quot) => {
    return ['Sales Head', 'COO', 'MD', 'CEO'].includes(user?.role) && quot.status !== 'Pending Deletion';
  };

  const canApprove = (quot) => {
    return user?.role === 'Sales Head' && (quot.status === 'Pending' || quot.status === 'Draft');
  };

  const pendingQuotations = quotations.filter(q => q.status === 'Pending' || q.status === 'Draft');
  const otherQuotations = quotations.filter(q => q.status !== 'Pending' && q.status !== 'Draft');

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingQuotations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-yellow-400" />
            Pending Approvals ({pendingQuotations.length})
          </h3>
          <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-gray-300">Client Name</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Created By</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingQuotations.map((quot) => (
                  <TableRow key={quot.id} className="border-white/20">
                    <TableCell className="text-white font-medium">{quot.client_name}</TableCell>
                    <TableCell className="text-white">AED {parseFloat(quot.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">{quot.created_by_name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quot.status)}>{quot.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canApprove(quot) && (
                          <>
                            <Button
                              onClick={() => handleApprove(quot, 'approve')}
                              size="sm"
                              className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleApprove(quot, 'reject')}
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {canEdit(quot) && (
                          <Button
                            onClick={() => handleEdit(quot)}
                            size="sm"
                            variant="outline"
                            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(quot) && (
                          <Button
                            onClick={() => handleDelete(quot)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* All Quotations */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">All Quotations ({otherQuotations.length})</h3>
        <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-gray-300">Client Name</TableHead>
                <TableHead className="text-gray-300">Amount</TableHead>
                <TableHead className="text-gray-300">Created By</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    No quotations found
                  </TableCell>
                </TableRow>
              ) : (
                otherQuotations.map((quot) => (
                  <TableRow key={quot.id} className="border-white/20">
                    <TableCell className="text-white font-medium">{quot.client_name}</TableCell>
                    <TableCell className="text-white">AED {parseFloat(quot.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-300">{quot.created_by_name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quot.status)}>{quot.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit(quot) && (
                          <Button
                            onClick={() => handleEdit(quot)}
                            size="sm"
                            variant="outline"
                            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(quot) && (
                          <Button
                            onClick={() => handleDelete(quot)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Quotation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (AED) *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="items">Items/Description</Label>
              <Textarea
                id="items"
                value={formData.items}
                onChange={(e) => setFormData({...formData, items: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {user?.role in ['COO', 'MD', 'CEO']
                ? 'Are you sure you want to permanently delete this quotation? This action cannot be undone.'
                : 'This will send a deletion request to COO/MD for approval.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-slate-900 rounded-lg border border-white/20 my-4">
            <p className="text-sm text-gray-400">
              Client: <span className="text-white font-medium">{selectedQuotation?.client_name}</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Amount: <span className="text-white font-medium">AED {parseFloat(selectedQuotation?.total_amount || 0).toLocaleString()}</span>
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionType === 'approve' ? 'Approve Quotation' : 'Reject Quotation'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="approval_remarks">Remarks (Optional)</Label>
              <Textarea
                id="approval_remarks"
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
              onClick={() => setShowApproveDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={loading}
              className={actionType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
            >
              {loading ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationManagementEnhanced;
