import { useState, useEffect } from 'react';
import { Package, Plus, Eye, Upload, Camera, CheckCircle, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import CertificateProgressTracker from './CertificateProgressTracker';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateDispatchManagement = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form states
  const [newCertificate, setNewCertificate] = useState({
    company_name: '',
    contact_person: '',
    contact_mobile: '',
    course_name: '',
    training_date: '',
    certificate_numbers: '',
    participants_count: '',
    certificate_type: 'In-House',
    courier_service: ''
  });

  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    dispatch_date: '',
    courier_service: '',
    tracking_number: '',
    expected_delivery_date: '',
    delivery_date: '',
    recipient_name: ''
  });

  const [deliveryPhoto, setDeliveryPhoto] = useState({
    photo_url: '',
    recipient_name: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/certificate-tracking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching certificate tracking:', error);
      toast.error('Failed to load certificate tracking');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/certificate-tracking/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateCertificate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const certNumbers = newCertificate.certificate_numbers.split(',').map(n => n.trim());
      
      await axios.post(`${API}/certificate-tracking`, {
        ...newCertificate,
        certificate_numbers: certNumbers,
        participants_count: parseInt(newCertificate.participants_count)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Certificate tracking created successfully!');
      setCreateOpen(false);
      fetchRecords();
      fetchStats();
      
      // Reset form
      setNewCertificate({
        company_name: '',
        contact_person: '',
        contact_mobile: '',
        course_name: '',
        training_date: '',
        certificate_numbers: '',
        participants_count: '',
        courier_service: ''
      });
    } catch (error) {
      console.error('Error creating certificate:', error);
      toast.error('Failed to create certificate tracking');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/certificate-tracking/${selectedRecord.id}/status`, statusUpdate, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Status updated successfully!');
      setStatusUpdateOpen(false);
      fetchRecords();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/certificate-tracking/${selectedRecord.id}/delivery-photo`, deliveryPhoto, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Delivery photo uploaded successfully!');
      setPhotoUploadOpen(false);
      fetchRecords();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload delivery photo');
    }
  };

  const openStatusUpdate = (record) => {
    setSelectedRecord(record);
    setStatusUpdate({
      status: record.status === 'initiated' ? 'prepared' :
              record.status === 'prepared' ? 'dispatched' :
              record.status === 'dispatched' ? 'in_transit' :
              record.status === 'in_transit' ? 'delivered' : '',
      notes: '',
      dispatch_date: '',
      courier_service: record.courier_service || '',
      tracking_number: '',
      expected_delivery_date: '',
      delivery_date: '',
      recipient_name: ''
    });
    setStatusUpdateOpen(true);
  };

  const openPhotoUpload = (record) => {
    setSelectedRecord(record);
    setDeliveryPhoto({ photo_url: '', recipient_name: '' });
    setPhotoUploadOpen(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'initiated': { color: 'bg-blue-500/20 text-blue-300 border-blue-400/50', label: 'Initiated' },
      'prepared': { color: 'bg-green-500/20 text-green-300 border-green-400/50', label: 'Prepared' },
      'dispatched': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50', label: 'Dispatched' },
      'in_transit': { color: 'bg-purple-500/20 text-purple-300 border-purple-400/50', label: 'In Transit' },
      'delivered': { color: 'bg-green-600/20 text-green-200 border-green-500/50', label: 'Delivered ✓' }
    };
    return badges[status] || badges['initiated'];
  };

  const filteredRecords = filterStatus === 'all' 
    ? records 
    : records.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8" />
              Certificate Dispatch & Delivery Tracking
            </h2>
            <p className="text-indigo-100 mt-1">Metro-style tracking from initiation to delivery</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Certificate
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-6 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-indigo-100">Total</p>
              <p className="text-3xl font-bold">{stats.total_certificates}</p>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
              <p className="text-sm text-blue-100">Initiated</p>
              <p className="text-3xl font-bold">{stats.initiated}</p>
            </div>
            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
              <p className="text-sm text-green-100">Prepared</p>
              <p className="text-3xl font-bold">{stats.prepared}</p>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
              <p className="text-sm text-yellow-100">Dispatched</p>
              <p className="text-3xl font-bold">{stats.dispatched}</p>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-4 border border-purple-400/30">
              <p className="text-sm text-purple-100">In Transit</p>
              <p className="text-3xl font-bold">{stats.in_transit}</p>
            </div>
            <div className="bg-green-600/20 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
              <p className="text-sm text-green-100">Delivered</p>
              <p className="text-3xl font-bold">{stats.delivered}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-white/5 border border-white/10">
          <TabsTrigger value="all">All ({records.length})</TabsTrigger>
          <TabsTrigger value="initiated">Initiated</TabsTrigger>
          <TabsTrigger value="prepared">Prepared</TabsTrigger>
          <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Certificate Records */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading certificates...</p>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No certificate records found</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const statusBadge = getStatusBadge(record.status);
            
            return (
              <div
                key={record.id}
                className="bg-white/5 rounded-lg p-5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{record.company_name}</h3>
                      <Badge className={statusBadge.color}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
                      <div>
                        <span className="text-slate-400">Contact:</span> {record.contact_person}
                      </div>
                      <div>
                        <span className="text-slate-400">Course:</span> {record.course_name}
                      </div>
                      <div>
                        <span className="text-slate-400">Certificates:</span> {record.certificate_numbers?.length || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRecord(record);
                        setDetailsOpen(true);
                      }}
                      className="border-blue-400/50 hover:bg-blue-500/20"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    {record.status !== 'delivered' && (
                      <Button
                        size="sm"
                        onClick={() => openStatusUpdate(record)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Update Status
                      </Button>
                    )}
                    {record.status === 'delivered' && !record.delivery_note_photo && (
                      <Button
                        size="sm"
                        onClick={() => openPhotoUpload(record)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Camera className="w-3 h-3 mr-1" />
                        Upload Photo
                      </Button>
                    )}
                  </div>
                </div>

                {/* Metro Progress Tracker */}
                <CertificateProgressTracker currentStatus={record.status} />
              </div>
            );
          })
        )}
      </div>

      {/* Create Certificate Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create Certificate Tracking</DialogTitle>
            <DialogDescription className="text-slate-400">
              Initiate a new certificate dispatch and delivery tracking
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCertificate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Company Name *</Label>
                <Input
                  value={newCertificate.company_name}
                  onChange={(e) => setNewCertificate({...newCertificate, company_name: e.target.value})}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Contact Person *</Label>
                <Input
                  value={newCertificate.contact_person}
                  onChange={(e) => setNewCertificate({...newCertificate, contact_person: e.target.value})}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Mobile *</Label>
                <Input
                  value={newCertificate.contact_mobile}
                  onChange={(e) => setNewCertificate({...newCertificate, contact_mobile: e.target.value})}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Course Name *</Label>
                <Input
                  value={newCertificate.course_name}
                  onChange={(e) => setNewCertificate({...newCertificate, course_name: e.target.value})}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Training Date *</Label>
                <Input
                  type="date"
                  value={newCertificate.training_date}
                  onChange={(e) => setNewCertificate({...newCertificate, training_date: e.target.value})}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Participants Count *</Label>
                <Input
                  type="number"
                  value={newCertificate.participants_count}
                  onChange={(e) => setNewCertificate({...newCertificate, participants_count: e.target.value})}
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white">Certificate Numbers (comma separated) *</Label>
              <Input
                value={newCertificate.certificate_numbers}
                onChange={(e) => setNewCertificate({...newCertificate, certificate_numbers: e.target.value})}
                placeholder="e.g., CERT-001, CERT-002, CERT-003"
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Certificate Tracking
              </Button>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Update Certificate Status</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div>
              <Label className="text-white">New Status</Label>
              <Select value={statusUpdate.status} onValueChange={(val) => setStatusUpdate({...statusUpdate, status: val})}>
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="prepared">Prepared</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusUpdate.status === 'dispatched' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Dispatch Date</Label>
                    <Input
                      type="date"
                      value={statusUpdate.dispatch_date}
                      onChange={(e) => setStatusUpdate({...statusUpdate, dispatch_date: e.target.value})}
                      className="bg-slate-800 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Expected Delivery</Label>
                    <Input
                      type="date"
                      value={statusUpdate.expected_delivery_date}
                      onChange={(e) => setStatusUpdate({...statusUpdate, expected_delivery_date: e.target.value})}
                      className="bg-slate-800 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Courier Service</Label>
                  <Input
                    value={statusUpdate.courier_service}
                    onChange={(e) => setStatusUpdate({...statusUpdate, courier_service: e.target.value})}
                    placeholder="e.g., Aramex, DHL, FedEx"
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Tracking Number</Label>
                  <Input
                    value={statusUpdate.tracking_number}
                    onChange={(e) => setStatusUpdate({...statusUpdate, tracking_number: e.target.value})}
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
              </>
            )}

            {statusUpdate.status === 'delivered' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Delivery Date</Label>
                    <Input
                      type="date"
                      value={statusUpdate.delivery_date}
                      onChange={(e) => setStatusUpdate({...statusUpdate, delivery_date: e.target.value})}
                      className="bg-slate-800 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Recipient Name</Label>
                    <Input
                      value={statusUpdate.recipient_name}
                      onChange={(e) => setStatusUpdate({...statusUpdate, recipient_name: e.target.value})}
                      className="bg-slate-800 border-white/10 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-white">Notes (Optional)</Label>
              <Textarea
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate({...statusUpdate, notes: e.target.value})}
                className="bg-slate-800 border-white/10 text-white"
                placeholder="Add any notes about this status update..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Status
              </Button>
              <Button type="button" variant="outline" onClick={() => setStatusUpdateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={photoUploadOpen} onOpenChange={setPhotoUploadOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Upload Delivery Note Photo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload photo of signed delivery note as proof
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePhotoUpload} className="space-y-4">
            <div>
              <Label className="text-white">Photo URL *</Label>
              <Input
                value={deliveryPhoto.photo_url}
                onChange={(e) => setDeliveryPhoto({...deliveryPhoto, photo_url: e.target.value})}
                placeholder="Paste image URL or upload link"
                required
                className="bg-slate-800 border-white/10 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Upload photo to cloud storage and paste URL here</p>
            </div>
            
            <div>
              <Label className="text-white">Recipient Name *</Label>
              <Input
                value={deliveryPhoto.recipient_name}
                onChange={(e) => setDeliveryPhoto({...deliveryPhoto, recipient_name: e.target.value})}
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-400/30 rounded p-3">
              <p className="text-blue-300 text-sm">
                📸 This photo serves as official proof of delivery. Ensure it shows:
              </p>
              <ul className="text-slate-300 text-xs mt-2 space-y-1">
                <li>• Clear image of delivery note</li>
                <li>• Recipient signature</li>
                <li>• Date and time stamp</li>
                <li>• Company stamp (if available)</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <Button type="button" variant="outline" onClick={() => setPhotoUploadOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      {selectedRecord && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl">Certificate Tracking Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Progress Tracker */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Delivery Progress</h3>
                <CertificateProgressTracker currentStatus={selectedRecord.status} />
              </div>

              {/* Company Info */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Company</p>
                    <p className="text-white font-medium">{selectedRecord.company_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Contact Person</p>
                    <p className="text-white">{selectedRecord.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Mobile</p>
                    <p className="text-white">{selectedRecord.contact_mobile}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Course</p>
                    <p className="text-white">{selectedRecord.course_name}</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Certificate Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Training Date</p>
                    <p className="text-white">{new Date(selectedRecord.training_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Participants</p>
                    <p className="text-white">{selectedRecord.participants_count}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400">Certificate Numbers</p>
                    <p className="text-white">{selectedRecord.certificate_numbers?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              {(selectedRecord.courier_service || selectedRecord.tracking_number) && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Delivery Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedRecord.courier_service && (
                      <div>
                        <p className="text-slate-400">Courier Service</p>
                        <p className="text-white">{selectedRecord.courier_service}</p>
                      </div>
                    )}
                    {selectedRecord.tracking_number && (
                      <div>
                        <p className="text-slate-400">Tracking Number</p>
                        <p className="text-white font-mono">{selectedRecord.tracking_number}</p>
                      </div>
                    )}
                    {selectedRecord.dispatch_date && (
                      <div>
                        <p className="text-slate-400">Dispatch Date</p>
                        <p className="text-white">{new Date(selectedRecord.dispatch_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedRecord.expected_delivery_date && (
                      <div>
                        <p className="text-slate-400">Expected Delivery</p>
                        <p className="text-white">{new Date(selectedRecord.expected_delivery_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Photo */}
              {selectedRecord.delivery_note_photo && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-400" />
                    Delivery Proof
                  </h3>
                  <div className="mb-3">
                    <p className="text-slate-400 text-sm">Received by: <span className="text-white font-medium">{selectedRecord.recipient_name}</span></p>
                  </div>
                  <img 
                    src={selectedRecord.delivery_note_photo} 
                    alt="Delivery Note" 
                    className="w-full rounded-lg border border-white/10"
                  />
                </div>
              )}

              {/* Status History */}
              {selectedRecord.status_history && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Status History</h3>
                  <div className="space-y-3">
                    {selectedRecord.status_history.map((history, idx) => (
                      <div key={idx} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                        <Clock className="w-4 h-4 text-blue-400 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadge(history.status).color}>
                              {getStatusBadge(history.status).label}
                            </Badge>
                            <p className="text-xs text-slate-500">{new Date(history.timestamp).toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">By: {history.updated_by}</p>
                          {history.notes && <p className="text-sm text-slate-400 mt-1">{history.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CertificateDispatchManagement;
