import { useState, useEffect } from 'react';
import { BookOpen, Folder, Download, Eye, Search, FileText, Video, Presentation, FileSpreadsheet, File, TrendingUp, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TrainerMaterials = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_folders: 0
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/academic-library/trainer-materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFolders(response.data.folders || []);
      setStats({
        total_documents: response.data.total_documents || 0,
        total_folders: response.data.total_folders || 0
      });
      
      // Auto-select first folder if available
      if (response.data.folders && response.data.folders.length > 0) {
        setSelectedFolder(response.data.folders[0]);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load training materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      
      // Track download
      await axios.post(`${API}/academic-library/documents/${doc.id}/track-download`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open file in new tab
      window.open(`${BACKEND_URL}${doc.file_url}`, '_blank');
      
      toast.success('Document opened! Download tracked.');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to open document');
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
      'blue': 'from-blue-500 to-blue-600',
      'green': 'from-green-500 to-green-600',
      'purple': 'from-purple-500 to-purple-600',
      'orange': 'from-orange-500 to-orange-600',
      'red': 'from-red-500 to-red-600',
      'pink': 'from-pink-500 to-pink-600'
    };
    return colors[color] || colors['blue'];
  };

  const filteredDocuments = selectedFolder?.documents?.filter(doc =>
    doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            Training Materials
          </h1>
          <p className="text-slate-400">Access your training documents, videos, and resources</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Available Folders</p>
                <p className="text-2xl font-bold text-white">{stats.total_folders}</p>
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
                <p className="text-2xl font-bold text-white">{stats.total_documents}</p>
              </div>
              <FileText className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Your Progress</p>
                <p className="text-2xl font-bold text-white">
                  {selectedFolder?.documents?.length || 0}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
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
                <Folder className="w-5 h-5 text-blue-400" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-slate-400 text-sm text-center py-4">Loading...</p>
              ) : folders.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No materials available yet</p>
                </div>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className={`${
                      selectedFolder?.id === folder.id
                        ? `bg-gradient-to-r ${getFolderColor(folder.color)} text-white`
                        : 'bg-white/5 border border-white/10 text-slate-300'
                    } rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Folder className="w-4 h-4" />
                      <p className="font-semibold text-sm">{folder.folder_name}</p>
                    </div>
                    <p className="text-xs opacity-80">{folder.documents?.length || 0} documents</p>
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
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Folder className="w-5 h-5 text-blue-400" />
                      {selectedFolder.folder_name}
                      <Badge className="bg-white/10 text-white border-white/20">
                        {filteredDocuments.length} documents
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">{selectedFolder.description}</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-white/10 text-white w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                      {searchTerm ? 'No documents match your search' : 'No documents in this folder'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => {
                      const DocIcon = getDocumentIcon(doc.document_type);
                      
                      return (
                        <div
                          key={doc.id}
                          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`${
                              doc.document_type === 'PDF' ? 'bg-red-500/20' :
                              doc.document_type === 'Video' ? 'bg-purple-500/20' :
                              doc.document_type === 'Presentation' ? 'bg-orange-500/20' :
                              doc.document_type === 'Spreadsheet' ? 'bg-green-500/20' :
                              'bg-blue-500/20'
                            } rounded-lg p-3`}>
                              <DocIcon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-white text-base">{doc.document_name}</h4>
                                <Badge className="bg-white/10 text-white border-white/20 text-xs">
                                  {doc.document_type}
                                </Badge>
                              </div>
                              
                              {doc.description && (
                                <p className="text-sm text-slate-400 mb-3">{doc.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                </div>
                                {doc.download_count > 0 && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{doc.download_count} downloads</span>
                                  </div>
                                )}
                                {doc.tags && doc.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {doc.tags.slice(0, 3).map((tag, idx) => (
                                      <span key={idx} className="px-2 py-0.5 bg-white/5 rounded text-slate-400">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleDownload(doc)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleDownload(doc)}
                                variant="outline"
                                className="border-white/10"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-24 text-center">
                <Folder className="w-24 h-24 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a category to view materials</h3>
                <p className="text-slate-400">Choose a folder from the left sidebar to access training documents</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-500/10 border-blue-400/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-1">📚 Training Materials Library</h4>
              <p className="text-xs text-slate-300">
                Access all your training materials in one place. Click "View" to preview documents or "Download" to save them for offline access. 
                All downloads are tracked for your training records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerMaterials;
