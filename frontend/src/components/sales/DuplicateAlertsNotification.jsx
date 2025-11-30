import { useState, useEffect } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DuplicateAlertsNotification = ({ onViewAll }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/duplicate-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data || []);
      setUnreadCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/10"
        >
          <Bell className="w-5 h-5 text-white" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-slate-900 border-white/20 p-0">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Duplicate Alerts
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              <p>No pending duplicate alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-white/5 cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-white">
                      Possible Duplicate
                    </p>
                    <Badge className={`text-xs ${
                      alert.confidence === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-orange-500/20 text-orange-300'
                    }`}>
                      {alert.similarity_score}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">
                    "{alert.company_name_a}" vs "{alert.company_name_b}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Submitted by: {alert.submitted_by_a} & {alert.submitted_by_b}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {alerts.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <Button
              onClick={onViewAll}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              View All Alerts ({unreadCount})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DuplicateAlertsNotification;
