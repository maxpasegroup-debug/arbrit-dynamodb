import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DispatchTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hrm/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allEmployees = response.data || [];
      const dispatchTeam = allEmployees.filter(emp => emp.department === 'Dispatch');
      setTeam(dispatchTeam);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Loading team...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-xl">Dispatch Team</CardTitle>
        <p className="text-sm text-gray-400 mt-1">Team members and attendance status</p>
      </CardHeader>
      <CardContent className="p-6">
        {team.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No dispatch team members</p>
          </div>
        ) : (
          <div className="space-y-3">
            {team.map((member) => (
              <Card key={member.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-sm text-gray-400">{member.mobile}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Designation</p>
                      <p className="text-white text-sm">
                        {member.designation === 'DISPATCH_HEAD' ? 'Dispatch Head' : 'Dispatch Assistant'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Branch</p>
                      <p className="text-white text-sm">{member.branch}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                    Active
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DispatchTeam;
