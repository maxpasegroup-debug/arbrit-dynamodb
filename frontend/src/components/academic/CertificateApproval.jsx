import { useEffect, useState } from 'react';
import { Award, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateApproval = () => {
  const [certificates, setCertificates] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [approvalData, setApprovalData] = useState({
    certificate_type: 'In-House',
    remarks: ''
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/certificate-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      // Silent fail - no toast on empty data
    }
  };

  const handleApprove = (certificate) => {
    setSelectedCertificate(certificate);
    setApprovalData({ certificate_type: certificate.certificate_type || 'In-House', remarks: '' });
    setShowDialog(true);
  };

  const submitApproval = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/academic/certificate-requests/${selectedCertificate.id}/approve`,
        approvalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Certificate approved for generation');
      setShowDialog(false);
      fetchCertificates();
    } catch (error) {
      console.error('Error approving certificate:', error);
      toast.error('Failed to approve certificate');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Generated': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Dispatched': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    return colors[status] || colors['Pending'];
  };

  const pendingCertificates = certificates.filter(c => c.status === 'Pending');
  const approvedCertificates = certificates.filter(c => c.status !== 'Pending');

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <Award className="w-6 h-6 text-indigo-400" />
        Certificate Issuance Approval
      </h3>

      {/* Pending Approvals */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Pending Certificate Requests ({pendingCertificates.length})</h4>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">WO Reference</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Trainer</TableHead>
                <TableHead className="text-gray-300">Training Date</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No pending certificate requests
                  </TableCell>
                </TableRow>
              ) : (
                pendingCertificates.map((cert) => (
                  <TableRow key={cert.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{cert.work_order_reference}</TableCell>
                    <TableCell className="text-gray-300">{cert.client_name}</TableCell>
                    <TableCell className="text-gray-300">{cert.course}</TableCell>
                    <TableCell className="text-gray-300">{cert.trainer_name}</TableCell>
                    <TableCell className="text-gray-300">{new Date(cert.training_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        {cert.certificate_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleApprove(cert)}
                        variant="ghost"
                        size="sm"
                        className="text-green-400 hover:bg-green-500/10"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Approved Certificates */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Approved Certificates ({approvedCertificates.length})</h4>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-gray-300">WO Reference</TableHead>
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Course</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Approved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedCertificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No approved certificates yet
                  </TableCell>
                </TableRow>
              ) : (
                approvedCertificates.map((cert) => (
                  <TableRow key={cert.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{cert.work_order_reference}</TableCell>
                    <TableCell className="text-gray-300">{cert.client_name}</TableCell>
                    <TableCell className="text-gray-300">{cert.course}</TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        {cert.certificate_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{cert.approved_by_name || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Approve Certificate Generation</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-400">WO Reference</p>
                    <p className="font-semibold">{selectedCertificate.work_order_reference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Client</p>
                    <p className="font-semibold">{selectedCertificate.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Course</p>
                    <p>{selectedCertificate.course}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Trainer</p>
                    <p>{selectedCertificate.trainer_name}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Certificate Type</label>
                <Select 
                  value={approvalData.certificate_type} 
                  onValueChange={(value) => setApprovalData({...approvalData, certificate_type: value})}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2f4d] border-white/20 text-white">
                    <SelectItem value="In-House">In-House Certificate</SelectItem>
                    <SelectItem value="International">International Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Remarks (Optional)</label>
                <Textarea
                  value={approvalData.remarks}
                  onChange={(e) => setApprovalData({...approvalData, remarks: e.target.value})}
                  rows={3}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="Any special instructions for certificate generation..."
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <FileText className="w-3 h-3 inline mr-1" />
                  After approval, this will be forwarded to Certificate Department for generation and then to Dispatch.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button onClick={submitApproval} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)' }} className="text-[#0a1e3d]">
              Approve for Generation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificateApproval;