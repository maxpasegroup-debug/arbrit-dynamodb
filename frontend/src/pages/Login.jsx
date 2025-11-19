import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [pin, setPinDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handlePinChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPinDigits(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`).focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!mobile || mobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    const pinCode = pin.join('');
    if (pinCode.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        mobile,
        pin: pinCode
      });

      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect based on role
      const roleToRoute = {
        'COO': '/dashboard/coo',
        'Management': '/dashboard/coo',
        'MD': '/dashboard/coo',
        'CEO': '/dashboard/coo',
        'HR': '/dashboard/hr',
        'Sales Head': '/dashboard/sales-head',
        'Tele Sales': '/dashboard/tele-sales',
        'Field Sales': '/dashboard/field-sales',
        'Sales Employee': '/dashboard/sales-employee',
        'Academic Head': '/dashboard/academic',
        'Trainer': '/dashboard/trainer',
        'Accounts Head': '/dashboard/accounts',
        'Accountant': '/dashboard/accounts',
        'Dispatch Head': '/dashboard/dispatch'
      };
      
      const route = roleToRoute[user.role] || '/dashboard';
      navigate(route);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid mobile number or PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #0a1e3d 0%, #1a2f4d 50%, #0d1b2a 100%)'
    }}>
      {/* Left Section - Company Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
        {/* Logo and Header */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_b916bfee-a2e0-4a78-a130-e219040d5774/artifacts/qhdckkjh_ARBRIT.jpeg" 
              alt="Arbrit Logo" 
              className="h-14 w-14 object-contain bg-white rounded-lg p-1"
            />
            <div>
              <h2 className="text-xl font-bold">Arbrit</h2>
              <p className="text-xs text-gray-300 uppercase tracking-wide">Professional Safety Training</p>
            </div>
          </div>

          <div className="mt-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Professional Safety
            </h1>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: '#d4af37' }}>
              Training Excellence
            </h1>
            <p className="text-gray-300 text-base leading-relaxed max-w-lg">
              Empowering organizations across UAE with world-class safety training solutions. ISO certified programs delivered by industry experts.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6 mt-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">15+</p>
                <p className="text-sm text-gray-400">Professional Courses</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">ISO</p>
                <p className="text-sm text-gray-400">Certified Training</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-gray-400">Training Centers</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">100%</p>
                <p className="text-sm text-gray-400">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>ISO 8002206</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Accredited Programs</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>UAE Wide</span>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-500/20 p-4 rounded-2xl">
                <Lock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-300 text-sm">Sign in to access your dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Mobile Number */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                  <Phone className="w-4 h-4 text-yellow-500" />
                  Mobile Number
                </label>
                <Input
                  data-testid="mobile-input"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-12 rounded-xl focus:border-yellow-500 focus:ring-yellow-500/20"
                />
                <p className="text-xs text-gray-400 mt-2">Use your registered mobile number</p>
              </div>

              {/* PIN */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-3">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  4-Digit PIN
                </label>
                <div className="flex gap-3 justify-center">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-${index}`}
                      data-testid={`pin-input-${index}`}
                      type="password"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-white/20 rounded-xl text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Enter your secure 4-digit PIN</p>
              </div>

              {/* Sign In Button */}
              <Button
                data-testid="sign-in-button"
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #c9a02c 100%)',
                  color: '#0a1e3d'
                }}
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3" />
                Secure login with encrypted authentication
              </p>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Need help? Contact your department head or IT support
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;