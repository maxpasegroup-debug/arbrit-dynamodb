import { useState } from 'react';
import { Building2, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ClientAccounts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Client Accounts</h3>
        <p className="text-gray-500 text-sm mt-1">Manage client accounts and billing information</p>
      </div>

      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Client accounts management coming soon</p>
        <p className="text-slate-500 text-sm mt-2">View and manage all client billing accounts</p>
      </div>
    </div>
  );
};

export default ClientAccounts;