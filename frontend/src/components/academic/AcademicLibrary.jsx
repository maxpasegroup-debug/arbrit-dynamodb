import { useState, useEffect } from 'react';
import { Folder, FolderPlus, Upload, FileText, Search, Grid, List, Download, Edit, Trash2, Eye, Plus, BookOpen, Video, FileSpreadsheet, Presentation, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import FileUpload from './FileUpload';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcademicLibrary = () => {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  
  // Form states
  const [newFolder, setNewFolder] = useState({
    folder_name: '',
    description: '',
    color: 'blue',
    icon: 'folder'
  });
  
  const [newDocument, setNewDocument] = useState({
    folder_id: '',
    document_name: '',
    document_type: 'PDF',
    file_url: '',
    file_size: 0,
    description: '',
    tags: '',
    access_level: 'All Trainers'
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFolders();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchDocuments(selectedFolder.id);
    }
  }, [selectedFolder]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic-library/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (folderId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic-library/documents?folder_id=${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic-library/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/academic-library/folders`, newFolder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Folder created successfully!');
      setFolderModalOpen(false);
      setNewFolder({ folder_name: '', description: '', color: 'blue', icon: 'folder' });
      fetchFolders();
      fetchStats();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/academic-library/folders/${editingFolder.id}`, newFolder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Folder updated successfully!');
      setFolderModalOpen(false);
      setEditingFolder(null);
      setNewFolder({ folder_name: '', description: '', color: 'blue', icon: 'folder' });
      fetchFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/academic-library/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Folder deleted successfully!');
      fetchFolders();
      fetchStats();
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete folder');
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder_id', newDocument.folder_id);
      formData.append('document_name', newDocument.document_name);
      formData.append('description', newDocument.description);
      formData.append('tags', newDocument.tags);
      formData.append('access_level', newDocument.access_level);
      
      await axios.post(`${API}/academic-library/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Document uploaded successfully!');
      setDocumentModalOpen(false);
      setSelectedFile(null);
      setNewDocument({
        folder_id: '',
        document_name: '',
        document_type: 'PDF',
        file_url: '',
        file_size: 0,
        description: '',
        tags: '',
        access_level: 'All Trainers'
      });
      fetchDocuments(selectedFolder.id);
      fetchFolders();
      fetchStats();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/academic-library/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Document deleted successfully!');
      fetchDocuments(selectedFolder.id);
      fetchFolders();
      fetchStats();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getDocumentIcon = (type) => {
    const icons = {
      'PDF': FileText,
      'Video': Video,
      'Presentation': Presentation,
      'Spreadsheet': FileSpreadsheet,
      'Document': FileText,
      'Other': File
    };
    return icons[type] || File;
  };

  const getFolderColor = (color) => {
    const colors = {
      'blue': 'from-blue-500 to-blue-600 bg-blue-500/20 border-blue-400/50',
      'green': 'from-green-500 to-green-600 bg-green-500/20 border-green-400/50',
      'purple': 'from-purple-500 to-purple-600 bg-purple-500/20 border-purple-400/50',
      'orange': 'from-orange-500 to-orange-600 bg-orange-500/20 border-orange-400/50',
      'red': 'from-red-500 to-red-600 bg-red-500/20 border-red-400/50',
      'pink': 'from-pink-500 to-pink-600 bg-pink-500/20 border-pink-400/50'
    };
    return colors[color] || colors['blue'];
  };

  const filteredDocuments = documents.filter(doc =>
    doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-yellow-400" />
            Academic Library
          </h1>
          <p className="text-slate-400">Organize and manage training materials for your team</p>
        </div>
        <Button
          onClick={() => {
            setEditingFolder(null);
            setNewFolder({ folder_name: '', description: '', color: 'blue', icon: 'folder' });
            setFolderModalOpen(true);
          }}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Folders</p>
                <p className="text-2xl font-bold text-white">{stats.total_folders || 0}</p>
              </div>
              <Folder className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Documents</p>
                <p className="text-2xl font-bold text-white">{stats.total_documents || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Size</p>
                <p className="text-2xl font-bold text-white">{stats.total_size_mb || 0} MB</p>
              </div>
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Document Types</p>
                <p className="text-2xl font-bold text-white">{Object.keys(stats.document_types || {}).length}</p>
              </div>
              <Grid className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Folders Sidebar */}
        <div className="col-span-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-yellow-400" />
                Folders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading && folders.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Loading...</p>
              ) : folders.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No folders yet. Create one to get started!</p>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`${
                      selectedFolder?.id === folder.id 
                        ? getFolderColor(folder.color) 
                        : 'bg-white/5 border-white/10'
                    } border rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-all group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Folder className={`w-4 h-4 ${selectedFolder?.id === folder.id ? 'text-white' : 'text-slate-400'}`} />
                          <p className={`font-semibold text-sm ${selectedFolder?.id === folder.id ? 'text-white' : 'text-slate-300'}`}>
                            {folder.folder_name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">{folder.document_count || 0} documents</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                            setNewFolder({
                              folder_name: folder.folder_name,
                              description: folder.description,
                              color: folder.color,
                              icon: folder.icon
                            });
                            setFolderModalOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents Area */}
        <div className="col-span-9">
          {selectedFolder ? (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-yellow-400" />
                    {selectedFolder.folder_name}
                    <Badge className="bg-white/10 text-white border-white/20">
                      {documents.length} documents
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-white/10 text-white w-64"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="border-white/10"
                    >
                      {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => {
                        setNewDocument({ ...newDocument, folder_id: selectedFolder.id });
                        setDocumentModalOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-slate-400 py-12">Loading documents...</p>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No documents in this folder yet.</p>
                    <Button
                      onClick={() => {
                        setNewDocument({ ...newDocument, folder_id: selectedFolder.id });
                        setDocumentModalOpen(true);
                      }}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Document
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-2'}>
                    {filteredDocuments.map((doc) => {
                      const DocIcon = getDocumentIcon(doc.document_type);
                      
                      if (viewMode === 'grid') {
                        return (
                          <div
                            key={doc.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className={`${
                                doc.document_type === 'PDF' ? 'bg-red-500/20' :
                                doc.document_type === 'Video' ? 'bg-purple-500/20' :
                                doc.document_type === 'Presentation' ? 'bg-orange-500/20' :
                                'bg-blue-500/20'
                              } rounded-lg p-3`}>
                                <DocIcon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => window.open(`${BACKEND_URL}${doc.file_url}`, '_blank')}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-400"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <h4 className="font-semibold text-white text-sm mb-1 truncate">{doc.document_name}</h4>
                            <p className="text-xs text-slate-400 mb-2 line-clamp-2">{doc.description}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{doc.document_type}</span>
                              <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            key={doc.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`${
                                doc.document_type === 'PDF' ? 'bg-red-500/20' :
                                doc.document_type === 'Video' ? 'bg-purple-500/20' :
                                doc.document_type === 'Presentation' ? 'bg-orange-500/20' :
                                'bg-blue-500/20'
                              } rounded-lg p-2`}>
                                <DocIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-sm mb-1">{doc.document_name}</h4>
                                <p className="text-xs text-slate-400">{doc.description}</p>
                              </div>
                              <Badge className="bg-white/10 text-white border-white/20">
                                {doc.document_type}
                              </Badge>
                              <span className="text-xs text-slate-500">{(doc.file_size / 1024).toFixed(1)} KB</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(`${BACKEND_URL}${doc.file_url}`, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-24 text-center">
                <Folder className="w-24 h-24 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a folder to view documents</h3>
                <p className="text-slate-400 mb-6">Choose a folder from the left sidebar or create a new one</p>
                <Button
                  onClick={() => {
                    setEditingFolder(null);
                    setNewFolder({ folder_name: '', description: '', color: 'blue', icon: 'folder' });
                    setFolderModalOpen(true);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create First Folder
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Folder Modal */}
      <Dialog open={folderModalOpen} onOpenChange={setFolderModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingFolder ? 'Edit Folder' : 'Create New Folder'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Folder Name *</Label>
                <Input
                  value={newFolder.folder_name}
                  onChange={(e) => setNewFolder({ ...newFolder, folder_name: e.target.value })}
                  placeholder="e.g., Fire Safety Training"
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={newFolder.description}
                  onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                  placeholder="Brief description of this folder's contents"
                  className="bg-slate-800 border-white/10 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-white">Color</Label>
                <Select value={newFolder.color} onValueChange={(val) => setNewFolder({ ...newFolder, color: val })}>
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setFolderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                {editingFolder ? 'Update' : 'Create'} Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Document Modal */}
      <Dialog open={documentModalOpen} onOpenChange={setDocumentModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDocument}>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Upload File *</Label>
                <FileUpload
                  onFileSelect={(file) => {
                    setSelectedFile(file);
                    // Auto-fill document name from filename if empty
                    if (!newDocument.document_name) {
                      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
                      setNewDocument({ ...newDocument, document_name: nameWithoutExt });
                    }
                  }}
                  onFileRemove={() => setSelectedFile(null)}
                  maxSize={50}
                />
              </div>
              
              <div>
                <Label className="text-white">Document Name *</Label>
                <Input
                  value={newDocument.document_name}
                  onChange={(e) => setNewDocument({ ...newDocument, document_name: e.target.value })}
                  placeholder="e.g., Fire Safety Guidelines"
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  placeholder="Brief description of this document"
                  className="bg-slate-800 border-white/10 text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Access Level</Label>
                  <Select 
                    value={newDocument.access_level} 
                    onValueChange={(val) => setNewDocument({ ...newDocument, access_level: val })}
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="All Trainers">All Trainers</SelectItem>
                      <SelectItem value="Selected Trainers">Selected Trainers</SelectItem>
                      <SelectItem value="Course Specific">Course Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Tags (comma separated)</Label>
                  <Input
                    value={newDocument.tags}
                    onChange={(e) => setNewDocument({ ...newDocument, tags: e.target.value })}
                    placeholder="e.g., fire safety, emergency"
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setDocumentModalOpen(false);
                  setSelectedFile(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcademicLibrary;
