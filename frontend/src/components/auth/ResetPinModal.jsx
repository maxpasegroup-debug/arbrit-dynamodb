import { useState } from 'react';
import { Key, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPinModal = ({ open, onOpenChange }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  const validatePin = (pin) => {
    // Must be 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return 'PIN must be exactly 4 digits';
    }
    
    // Cannot be sequential or repeated
    if (pin === '1234' || pin === '4321' || pin === '1111' || pin === '0000') {
      return 'PIN cannot be sequential or repeated digits';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate new PIN
    const error = validatePin(pinData.newPin);
    if (error) {
      toast.error(error);
      return;
    }
    
    // Check if PINs match
    if (pinData.newPin !== pinData.confirmPin) {
      toast.error('New PIN and Confirm PIN do not match');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/user/change-pin`, {
        current_pin: pinData.currentPin,
        new_pin: pinData.newPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('PIN changed successfully!');
      setStep(3); // Success step
      
      setTimeout(() => {
        onOpenChange(false);
        setStep(1);
        setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      }, 2000);
      
    } catch (error) {
      console.error('Error changing PIN:', error);
      toast.error(error.response?.data?.detail || 'Failed to change PIN. Please check your current PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    setPinData({ currentPin: '', newPin: '', confirmPin: '' });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/30">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            Reset Your PIN
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === 1 && "Enter your current PIN and choose a new secure PIN"}
            {step === 2 && "Confirm your new PIN"}
            {step === 3 && "PIN changed successfully!"}
          </DialogDescription>
        </DialogHeader>

        {step < 3 ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Current PIN */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Current PIN
              </Label>
              <Input
                type="password"
                maxLength="6"
                value={pinData.currentPin}
                onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value.replace(/\D/g, '') })}
                placeholder="Enter current PIN"
                className="bg-slate-800 border-white/10 text-white text-lg tracking-widest text-center"
                required
                autoFocus
              />
            </div>

            {/* New PIN */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-green-400" />
                New PIN (6 digits)
              </Label>
              <Input
                type="password"
                maxLength="6"
                value={pinData.newPin}
                onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '') })}
                placeholder="Enter new PIN"
                className="bg-slate-800 border-white/10 text-white text-lg tracking-widest text-center"
                required
              />
            </div>

            {/* Confirm PIN */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-green-400" />
                Confirm New PIN
              </Label>
              <Input
                type="password"
                maxLength="6"
                value={pinData.confirmPin}
                onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                placeholder="Confirm new PIN"
                className="bg-slate-800 border-white/10 text-white text-lg tracking-widest text-center"
                required
              />
            </div>

            {/* Security Requirements */}
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="text-blue-300 font-semibold">PIN Requirements:</p>
                  <ul className="text-slate-400 space-y-1 ml-4">
                    <li>• Must be exactly 6 digits</li>
                    <li>• Cannot be sequential (123456)</li>
                    <li>• Cannot be repeated digits (111111)</li>
                    <li>• Should be easy to remember but hard to guess</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update PIN'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">PIN Changed Successfully!</h3>
            <p className="text-slate-400">Your new PIN is now active. Please remember it for future logins.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPinModal;
