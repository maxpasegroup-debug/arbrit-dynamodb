import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const TrainerUploads = () => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    toast.info('File upload feature coming soon');
    setFile(null);
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    toast.info('Messaging feature coming soon');
    setMessage('');
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card className="bg-slate-900 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Upload Training Materials</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Share training materials, presentations, and documents</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select File
            </label>
            <Input
              type="file"
              onChange={handleFileChange}
              className="bg-slate-900 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-500/20 file:text-yellow-400 hover:file:bg-yellow-500/30"
            />
            {file && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                <FileText className="w-4 h-4 text-yellow-400" />
                <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Communication Section */}
      <Card className="bg-slate-900 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Communication Center</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Send messages to coordinators and academic head</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-slate-900 border-white/20 text-white placeholder:text-gray-400 min-h-32"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/50 hover:bg-yellow-500/30"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-500/10 border-blue-400/30">
        <CardContent className="p-4 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400 mt-1" />
          <div>
            <h4 className="text-blue-300 font-medium mb-1">Communication Guidelines</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• Upload session materials before or after training</li>
              <li>• Share presentations, handouts, and reference documents</li>
              <li>• Communicate any issues or requirements promptly</li>
              <li>• Keep coordinators updated on session progress</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerUploads;
