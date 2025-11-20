import { FileText } from 'lucide-react';

const QuotationManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-400" />
        <div>
          <h3 className="text-xl font-semibold text-white">Quotation Management</h3>
          <p className="text-sm text-gray-400">Create and manage quotations</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
        <p className="text-gray-300">Quotation Management - Coming Soon</p>
        <p className="text-sm text-gray-500 mt-2">Feature under development</p>
      </div>
    </div>
  );
};

export default QuotationManagement;