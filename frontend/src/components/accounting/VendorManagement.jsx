import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VendorManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Vendor Management</h3>
          <p className="text-slate-400 text-sm mt-1">Manage vendors and supplier payments</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
        <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg">No vendors registered yet</p>
        <p className="text-slate-500 text-sm mt-2">Add vendors to track payments and invoices</p>
      </div>
    </div>
  );
};

export default VendorManagement;