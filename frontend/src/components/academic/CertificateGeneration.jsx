import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Award, Plus, X, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateGeneration = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [generatedCerts, setGeneratedCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // Form state
  const [selectedWO, setSelectedWO] = useState(undefined);
  const [courseName, setCourseName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [candidates, setCandidates] = useState([{ name: '', grade: '' }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [woRes, certsRes] = await Promise.all([
        axios.get(`${API}/academic/work-orders-for-certificates`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/academic/generated-certificates`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setWorkOrders(woRes.data || []);
      setGeneratedCerts(certsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  const handleWOSelect = (woId) => {
    setSelectedWO(woId);
    const wo = workOrders.find(w => w.id === woId);
    if (wo) {
      setCourseName(wo.course || '');
    }
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', grade: '' }]);
  };

  const removeCandidate = (index) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const handleGenerate = async () => {
    if (!selectedWO) {
      toast.error('Please select a work order');
      return;
    }
    if (!courseName || !trainerName || !trainingDate || !completionDate) {
      toast.error('Please fill all required fields');
      return;
    }
    if (candidates.some(c => !c.name)) {
      toast.error('Please enter names for all candidates');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/academic/generate-certificates`,
        {
          work_order_id: selectedWO,
          candidates: candidates,
          course_name: courseName,
          trainer_name: trainerName,
          training_date: trainingDate,
          completion_date: completionDate,
          expiry_date: expiryDate || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      setShowGenerateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error generating certificates:', error);
      toast.error('Failed to generate certificates');
    }
  };

  const resetForm = () => {
    setSelectedWO(undefined);
    setCourseName('');
    setTrainerName('');
    setTrainingDate('');
    setCompletionDate('');
    setExpiryDate('');
    setCandidates([{ name: '', grade: '' }]);
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Generate Certificates Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white text-xl">Generate Certificates</CardTitle>
              <p className="text-sm text-gray-400 mt-1">Create in-house training certificates</p>
            </div>
            <Button
              onClick={() => setShowGenerateModal(true)}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </CardHeader>
        </Card>

        {/* Generated Certificates List */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-white text-xl">Generated Certificates</CardTitle>
            <p className="text-sm text-gray-400 mt-1">View and manage issued certificates</p>
          </CardHeader>
          <CardContent className="p-6">
            {generatedCerts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No certificates generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedCerts.map((cert) => (
                  <Card key={cert.id} className="bg-white border-gray-200 hover:bg-white transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Certificate No.</p>
                            <p className="text-white font-mono">{cert.certificate_no}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Candidate</p>
                            <p className="text-white">{cert.candidate_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Course</p>
                            <p className="text-white">{cert.course_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Issue Date</p>
                            <p className="text-white">{new Date(cert.issue_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                            {cert.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Certificate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="bg-[#1a2f4d] border-gray-300 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Generate Training Certificates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Work Order Selection */}
            <div>
              <Label className="text-gray-300">Select Work Order</Label>
              <Select value={selectedWO} onValueChange={handleWOSelect}>
                <SelectTrigger className="bg-white border-gray-300 text-white mt-2">
                  <SelectValue placeholder="Choose work order" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2f4d] border-gray-300">
                  {workOrders.map(wo => (
                    <SelectItem key={wo.id} value={wo.id} className="text-white hover:bg-white">
                      {wo.wo_ref_no} - {wo.client_name} ({wo.course})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Course Name</Label>
                <Input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="bg-white border-gray-300 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Trainer Name</Label>
                <Input
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="bg-white border-gray-300 text-white mt-2"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">Training Date</Label>
                <Input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                  className="bg-white border-gray-300 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Completion Date</Label>
                <Input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="bg-white border-gray-300 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-300">Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-white border-gray-300 text-white mt-2"
                />
              </div>
            </div>

            {/* Candidates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-300">Candidates</Label>
                <Button
                  size="sm"
                  onClick={addCandidate}
                  className="bg-green-500/20 text-green-400 border border-green-400/50 hover:bg-green-500/30"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {candidates.map((candidate, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white p-3 rounded">
                    <span className="text-gray-400 text-sm w-8">{index + 1}.</span>
                    <Input
                      placeholder="Candidate Name"
                      value={candidate.name}
                      onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                      className="bg-white border-gray-300 text-white flex-1"
                    />
                    <Input
                      placeholder="Grade (Optional)"
                      value={candidate.grade}
                      onChange={(e) => updateCandidate(index, 'grade', e.target.value)}
                      className="bg-white border-gray-300 text-white w-32"
                    />
                    {candidates.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCandidate(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateModal(false);
                resetForm();
              }}
              className="border-gray-300 text-white hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              <Award className="w-4 h-4 mr-2" />
              Generate Certificates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificateGeneration;
