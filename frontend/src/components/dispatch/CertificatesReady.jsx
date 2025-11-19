import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificatesReady = () => {
  const [certificates, setCertificates] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(undefined);
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchCertificates();
    fetchAssistants();
  }, [selectedBranch]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/certificates-ready`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { branch: selectedBranch }
      });
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const fetchAssistants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allEmployees = response.data || [];
      const dispatchAssistants = allEmployees.filter(
        emp => emp.designation === 'DISPATCH_ASSISTANT' || emp.designation === 'Dispatch Assistant'
      );
      setAssistants(dispatchAssistants);
    } catch (error) {
      console.error('Error fetching assistants:', error);
    }
  };

  const handleSelectCert = (certId) => {
    setSelectedCerts(prev => 
      prev.includes(certId) ? prev.filter(id => id !== certId) : [...prev, certId]
    );
  };

  const handleAssignTasks = async () => {
    if (selectedCerts.length === 0) {
      toast.error('Please select at least one certificate');
      return;
    }
    if (!selectedAssistant) {
      toast.error('Please select a dispatch assistant');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const assistant = assistants.find(a => a.id === selectedAssistant);
      
      await axios.post(
        `${API}/dispatch/tasks`,
        {
          certificate_ids: selectedCerts,
          assigned_to_employee_id: selectedAssistant,
          assigned_to_employee_name: assistant?.name || '',
          due_date: dueDate || null,
          remarks: remarks || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${selectedCerts.length} delivery tasks created successfully`);
      setShowAssignModal(false);
      setSelectedCerts([]);
      setSelectedAssistant(undefined);
      setDueDate('');
      setRemarks('');
      fetchCertificates();
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast.error('Failed to create delivery tasks');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading certificates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white text-xl">Certificates Ready for Dispatch</CardTitle>
            <p className="text-sm text-gray-400 mt-1">Select certificates and assign to dispatch assistants</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2f4d] border-white/20">
                <SelectItem value="All" className="text-white hover:bg-white/10">All Branches</SelectItem>
                <SelectItem value="Dubai" className="text-white hover:bg-white/10">Dubai</SelectItem>
                <SelectItem value="Abu Dhabi" className="text-white hover:bg-white/10">Abu Dhabi</SelectItem>
                <SelectItem value="Saudi Arabia" className="text-white hover:bg-white/10">Saudi Arabia</SelectItem>
              </SelectContent>
            </Select>
            {selectedCerts.length > 0 && (
              <Button
                onClick={() => setShowAssignModal(true)}
                className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign Selected ({selectedCerts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {certificates.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No certificates ready for dispatch</p>
              <p className="text-sm text-gray-500 mt-2">Certificates will appear here once approved by Academic Head</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <Card key={cert.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Checkbox
                      checked={selectedCerts.includes(cert.id)}
                      onCheckedChange={() => handleSelectCert(cert.id)}
                      className="border-white/30"
                    />
                    <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Client</p>
                        <p className="text-white font-medium">{cert.client_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Course</p>
                        <p className="text-white">{cert.course_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Branch</p>
                        <p className="text-white">{cert.client_branch || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">WO Ref</p>
                        <p className="text-white">{cert.wo_ref_no || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Delivery Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Selected Certificates: {selectedCerts.length}</Label>
            </div>
            <div>
              <Label className="text-gray-300">Assign to Dispatch Assistant</Label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white mt-2">
                  <SelectValue placeholder="Choose assistant" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-white/20">
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id} className="text-white hover:bg-white/10">
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-300">Remarks (Optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
                placeholder="Add any notes or special instructions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTasks}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              Create Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificatesReady;
