import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const FileUpload = ({ onFileSelect, onFileRemove, accept = "*", maxSize = 50 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    // Check file size (in MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFileRemove();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['mp4', 'avi', 'mov'].includes(ext)) return '🎥';
    if (['mp3', 'wav'].includes(ext)) return '🎵';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
            dragActive
              ? 'border-yellow-400 bg-yellow-500/10'
              : error
              ? 'border-red-400 bg-red-500/10'
              : 'border-white/20 bg-slate-900 hover:border-white/40 hover:bg-white'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleChange}
            accept={accept}
          />
          
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <div className={`mb-4 p-4 rounded-full ${
              dragActive ? 'bg-yellow-500/20' : 'bg-white'
            }`}>
              <Upload className={`w-8 h-8 ${
                dragActive ? 'text-yellow-400' : 'text-slate-400'
              }`} />
            </div>
            
            <p className="text-white font-semibold mb-2">
              {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
            </p>
            
            <p className="text-sm text-slate-400 mb-1">
              PDF, DOC, XLS, PPT, MP4, Images, etc.
            </p>
            
            <p className="text-xs text-slate-500">
              Maximum file size: {maxSize}MB
            </p>
          </label>
          
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-3xl">{getFileIcon(selectedFile.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemove}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
