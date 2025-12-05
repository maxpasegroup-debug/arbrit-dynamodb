import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DeliveryHistory = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryHistory();
  }, []);

  const fetchDeliveryHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dispatch/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'DELIVERED' }
      });
      setDeliveries(response.data || []);
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      // Silent fail - no toast on empty data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-xl">Delivery History & Proofs</CardTitle>
        <p className="text-sm text-gray-400 mt-1">Completed deliveries with proof of delivery</p>
      </CardHeader>
      <CardContent className="p-6">
        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No completed deliveries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className="bg-slate-900 border-white/10 hover:bg-white transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Client</p>
                        <p className="text-white font-medium">{delivery.client_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Branch</p>
                        <p className="text-white">{delivery.client_branch}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Delivered By</p>
                        <p className="text-white">{delivery.assigned_to_employee_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Delivered At</p>
                        <p className="text-white">
                          {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {delivery.proof_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Proof
                      </Button>
                    )}
                  </div>
                  {delivery.remarks && (
                    <div className="mt-3 p-2 bg-slate-900 rounded text-sm">
                      <p className="text-xs text-gray-400">Remarks:</p>
                      <p className="text-gray-300">{delivery.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryHistory;
