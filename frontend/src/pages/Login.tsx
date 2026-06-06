import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, Phone, MapPin, Building, FileSpreadsheet, Eye, EyeOff, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Mode state: 'LOGIN' | 'REGISTER' | 'FORGOT'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Show password state
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'PROCUREMENT_OFFICER' | 'VENDOR' | 'MANAGER'>('PROCUREMENT_OFFICER');

  // Vendor Specific Fields
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
        login(data.accessToken, data.refreshToken, data.user);
        navigate('/dashboard');
      } else if (mode === 'REGISTER') {
        const payload: any = { name, email, password, role };
        if (role === 'VENDOR') {
          payload.companyName = companyName;
          payload.category = category;
          payload.gstNumber = gstNumber;
          payload.panNumber = panNumber;
          payload.phone = phone;
          payload.address = address;
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');

        login(data.accessToken, data.refreshToken, data.user);
        navigate('/dashboard');
      } else if (mode === 'FORGOT') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Password reset failed');

        setSuccess('Password has been successfully updated! You can now sign in.');
        setEmail('');
        setPassword('');
        setMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-dark px-4 py-12 relative overflow-hidden">
      {/* Decorative Gold Light Ring Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 lg:p-10 relative z-10">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-extrabold text-accent text-2xl shadow-premium mb-3">
            V
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wider">VENDORBRIDGE</h1>
          <p className="text-xs text-gray-400 mt-1">Enterprise Procurement ERP Portal</p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success text-xs rounded-xl font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {mode === 'REGISTER' && (
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Sarah Connor"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Select Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                  <option value="VENDOR">Vendor Partner</option>
                  <option value="MANAGER">Manager / Approver</option>
                </select>
              </div>

              {/* Dynamic Vendor Form Fields */}
              {role === 'VENDOR' && (
                <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <h3 className="text-xs font-extrabold text-primary tracking-wider uppercase">Vendor Organization Details</h3>
                  
                  {/* Company Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-2.5 text-gray-500" size={14} />
                      <input
                        type="text"
                        required
                        placeholder="Apex Solutions Pvt Ltd"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Vendor Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IT Hardware, Logistics"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  {/* GST & PAN (Side by Side) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">GST Number</label>
                      <input
                        type="text"
                        required
                        placeholder="29AAAAA1111A1Z1"
                        value={gstNumber}
                        onChange={e => setGstNumber(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">PAN Number</label>
                      <input
                        type="text"
                        required
                        placeholder="AAAAA1111A"
                        value={panNumber}
                        onChange={e => setPanNumber(e.target.value.toUpperCase())}
                        className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-2.5 text-gray-500" size={14} />
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Office Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-2.5 text-gray-500" size={14} />
                      <input
                        type="text"
                        required
                        placeholder="Plot 45, Tech Zone, Bangalore"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-gray-500" size={16} />
              <input
                type="email"
                required
                placeholder="officer@vendorbridge.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Password Input Block */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                {mode === 'FORGOT' ? 'New Password' : 'Password'}
              </label>
              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => setMode('FORGOT')}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 text-gray-500" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={mode === 'FORGOT' ? 'Enter new password' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/60 text-white rounded-xl pl-11 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-accent font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-premium flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : mode === 'LOGIN' ? (
              'Sign In to Dashboard'
            ) : mode === 'REGISTER' ? (
              'Complete Registration'
            ) : (
              'Request Password Reset'
            )}
          </button>
        </form>

        {/* Footer toggles */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center text-xs text-gray-400">
          {mode === 'LOGIN' ? (
            <p>
              New vendor?{' '}
              <button
                onClick={() => {
                  setMode('REGISTER');
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : mode === 'REGISTER' ? (
            <p>
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Sign in instead
              </button>
            </p>
          ) : (
            <p>
              Return to{' '}
              <button
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                }}
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
