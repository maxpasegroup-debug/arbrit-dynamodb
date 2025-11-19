import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FileImage, Plus, Edit, Trash2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [sealUrl, setSealUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1a2f4d');
  const [secondaryColor, setSecondaryColor] = useState('#f59e0b');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditMode(false);
    setCurrentTemplate(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditMode(true);
    setCurrentTemplate(template);
    setName(template.name);
    setLogoUrl(template.logo_url || '');
    setSealUrl(template.seal_url || '');
    setSignatureUrl(template.signature_url || '');
    setPrimaryColor(template.primary_color || '#1a2f4d');
    setSecondaryColor(template.secondary_color || '#f59e0b');
    setIsDefault(template.is_default || false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name) {
      toast.error('Template name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = {
        name,
        logo_url: logoUrl || null,
        seal_url: sealUrl || null,
        signature_url: signatureUrl || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        is_default: isDefault
      };

      if (editMode && currentTemplate) {
        await axios.put(
          `${API}/academic/templates/${currentTemplate.id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Template updated successfully');
      } else {
        await axios.post(
          `${API}/academic/templates`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Template created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/academic/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setName('');
    setLogoUrl('');
    setSealUrl('');
    setSignatureUrl('');
    setPrimaryColor('#1a2f4d');
    setSecondaryColor('#f59e0b');
    setIsDefault(false);
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white text-xl">Certificate Templates</CardTitle>
            <p className="text-sm text-gray-400 mt-1">Manage certificate design templates</p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No templates created yet</p>
              <p className="text-sm text-gray-500 mt-2">Create your first certificate template</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <Card key={template.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold">{template.name}</h3>
                          {template.is_default && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                              <Check className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Type</p>
                            <p className="text-white">{template.type}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Logo</p>
                            <p className="text-white">{template.logo_url ? '✓ Set' : '✗ Not set'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Signature</p>
                            <p className="text-white">{template.signature_url ? '✓ Set' : '✗ Not set'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(template.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create/Edit Template Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1a2f4d] border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editMode ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Template Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
                placeholder="e.g., Default Inhouse Template"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Primary Color</Label>
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="bg-white/5 border-white/20 text-white mt-2 h-10"
                />
              </div>
              <div>
                <Label className="text-gray-300">Secondary Color</Label>
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="bg-white/5 border-white/20 text-white mt-2 h-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Logo URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label className="text-gray-300">Digital Seal URL</Label>
              <Input
                value={sealUrl}
                onChange={(e) => setSealUrl(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
                placeholder="https://example.com/seal.png"
              />
            </div>

            <div>
              <Label className="text-gray-300">Signature URL</Label>
              <Input
                value={signatureUrl}
                onChange={(e) => setSignatureUrl(e.target.value)}
                className="bg-white/5 border-white/20 text-white mt-2"
                placeholder="https://example.com/signature.png"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={isDefault}
                onCheckedChange={setIsDefault}
                className="border-white/30"
              />
              <Label className="text-gray-300">Set as default template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              {editMode ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CertificateTemplates;
