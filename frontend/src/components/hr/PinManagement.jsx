import { useState, useEffect } from 'react';
import { Key, Shield, User, CheckCircle, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PinManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchAllPinStatus();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile.includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchAllPinStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hr/pin-status/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error fetching PIN status:', error);
      toast.error('Failed to load PIN status data');
    } finally {
      setLoading(false);
    }
  };

  const canResetPin = (targetUser) => {
    if (!currentUser) return false;
    
    // Cannot reset own PIN via this interface
    if (targetUser.id === currentUser.id) return false;
    
    // MD can reset anyone except self
    if (currentUser.role === 'MD') return true;
    
    // COO cannot reset MD's PIN
    if (currentUser.role === 'COO' && targetUser.role === 'MD') return false;
    
    // COO can reset others
    if (currentUser.role === 'COO') return true;
    
    return false;
  };

  const handleResetClick = (user) => {
    if (!canResetPin(user)) {
      if (user.id === currentUser.id) {
        toast.error('Use your profile Reset PIN button to change your own PIN');
      } else {
        toast.error('You do not have permission to reset this user\'s PIN');
      }
      return;
    }
    setSelectedUser(user);
    setResetModalOpen(true);
  };

  const handleResetPin = async () => {
    // Validate PIN
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    if (newPin === '1234' || newPin === '4321' || newPin === '1111' || newPin === '0000') {
      toast.error('Please choose a more secure PIN');
      return;
    }

    setResetting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/hr/reset-pin/${selectedUser.id}`, {
        new_pin: newPin,
        temporary: isTemporary
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`PIN reset successfully for ${selectedUser.name}`);
      setResetModalOpen(false);
      setNewPin('');
      setConfirmPin('');
      setIsTemporary(false);
      setSelectedUser(null);
      
      // Refresh data
      fetchAllPinStatus();
    } catch (error) {
      console.error('Error resetting PIN:', error);
      toast.error(error.response?.data?.detail || 'Failed to reset PIN');
    } finally {
      setResetting(false);
    }
  };

  const getPinStatusBadge = (status) => {
    switch (status) {
      case 'custom':
        return <Badge className="bg-green-500/20 text-green-300 border-green-400/50">Custom</Badge>;
      case 'temporary':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/50">Temporary</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">Default</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Loading PIN management data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Key className="w-8 h-8 text-amber-400" />
          PIN Management System
        </h2>
        <p className="text-slate-400 mt-1">Manage and reset user PINs securely</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-white/5 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">{users.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Custom PINs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-400">
              {users.filter(u => u.pin_status === 'custom').length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Temporary PINs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-400">
              {users.filter(u => u.pin_status === 'temporary').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name, mobile, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-white/10 text-white"
          />
        </div>
        <Button
          onClick={fetchAllPinStatus}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Mobile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">PIN Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Last Changed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-full">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            {user.pin_change_required && (
                              <p className="text-xs text-yellow-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Change Required
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{user.mobile}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{getPinStatusBadge(user.pin_status)}</td>
                      <td className="px-6 py-4 text-slate-300">{formatDate(user.pin_last_changed)}</td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => handleResetClick(user)}
                          disabled={!canResetPin(user)}
                          className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset PIN
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset PIN Modal */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              Reset PIN
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Reset PIN for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* User Info */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-semibold">{selectedUser?.name}</p>
                  <p className="text-slate-400 text-sm">{selectedUser?.role} • {selectedUser?.mobile}</p>
                </div>
              </div>
            </div>

            {/* New PIN */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-green-400" />
                New PIN (4 digits)
              </Label>
              <Input
                type="password"
                maxLength="4"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter new PIN"
                className="bg-slate-800 border-white/10 text-white text-lg tracking-widest text-center"
                autoFocus
              />
            </div>

            {/* Confirm PIN */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-green-400" />
                Confirm PIN
              </Label>
              <Input
                type="password"
                maxLength="4"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm new PIN"
                className="bg-slate-800 border-white/10 text-white text-lg tracking-widest text-center"
              />
            </div>

            {/* Temporary PIN Option */}
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
              <input
                type="checkbox"
                id="temporary"
                checked={isTemporary}
                onChange={(e) => setIsTemporary(e.target.checked)}
                className="w-5 h-5 rounded border-white/20"
              />
              <label htmlFor="temporary" className="text-white text-sm flex-1 cursor-pointer">
                <span className="font-semibold">Mark as Temporary</span>
                <p className="text-slate-400 text-xs mt-1">User will be required to change PIN on next login</p>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetModalOpen(false);
                  setNewPin('');
                  setConfirmPin('');
                  setIsTemporary(false);
                }}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPin}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Reset PIN'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PinManagement;
