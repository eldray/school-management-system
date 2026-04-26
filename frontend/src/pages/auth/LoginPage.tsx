import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../hooks/useAuth';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sparkles, BookOpen, Users, Award, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const { token } = useAuth();

  // Fix the refresh loop - only redirect if we have a token
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => navigate('/dashboard', { replace: true }),
        onError: (err: any) => alert(err.response?.data?.message || 'Login failed'),
      }
    );
  };

  const appName = 'EduManage Pro';
  const appInitials = 'EM';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-5/12 flex flex-col items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          
          {/* App Logo & Name */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl shadow-lg flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{appName}</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Complete School Management Suite
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">Welcome Back</h3>
              <p className="text-gray-500 text-sm mt-1">Sign in to access your dashboard</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 focus:bg-white transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-emerald-600 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Test Credentials Toggle - Only for development */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                {showCredentials ? 'Hide demo accounts' : 'Show demo accounts'}
              </button>
              
              {showCredentials && (
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Demo Accounts (Development Only)
                  </p>
                  <div className="space-y-2.5">
                    <CredentialRow label="Super Admin" email="super.admin@school.com" password="password123" setEmail={setEmail} setPassword={setPassword} />
                    <CredentialRow label="Admin" email="emk.appiah@gmail.com" password="Shiny-2-Music-Liver-Trend" setEmail={setEmail} setPassword={setPassword} />
                    <CredentialRow label="Teacher" email="teacher.john@school.com" password="password123" setEmail={setEmail} setPassword={setPassword} />
                    <CredentialRow label="Parent" email="parent.kofi@email.com" password="password123" setEmail={setEmail} setPassword={setPassword} />
                    <CredentialRow label="Student" email="student.kwame@school.com" password="password123" setEmail={setEmail} setPassword={setPassword} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 {appName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-emerald-500/10" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 w-full text-white">
          <div className="max-w-xl">
            {/* App Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <GraduationCap className="w-4 h-4" />
              <span className="text-xs font-medium tracking-wide">SCHOOL MANAGEMENT PLATFORM</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              <span className="text-white">Streamline Your</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                School Operations
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-lg">
              Everything you need to manage students, teachers, exams, fees, and academics — all in one powerful, easy-to-use platform.
            </p>
            
            {/* Feature List */}
            <div className="space-y-4 mb-10">
              {[
                { icon: Users, title: 'Student & Staff Management', desc: 'Complete profiles, attendance tracking, and performance monitoring' },
                { icon: BookOpen, title: 'Academic Excellence', desc: 'Exams, assessments, report cards, and grade analytics' },
                { icon: Award, title: 'Financial Control', desc: 'Fee collection, payment tracking, and financial reporting' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{title}</h4>
                    <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Trusted by schools</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for credential rows with auto-fill
function CredentialRow({ 
  label, 
  email, 
  password, 
  setEmail, 
  setPassword 
}: { 
  label: string; 
  email: string; 
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
}) {
  const handleClick = () => {
    setEmail(email);
    setPassword(password);
  };
  
  return (
    <div 
      className="flex items-center justify-between text-xs cursor-pointer hover:bg-amber-100/50 p-1.5 -mx-1.5 rounded-lg transition-colors"
      onClick={handleClick}
      title="Click to auto-fill credentials"
    >
      <span className="font-medium text-amber-900 w-24">{label}:</span>
      <span className="font-mono text-amber-700 truncate max-w-[160px]">{email}</span>
      <span className="text-amber-500 mx-1">/</span>
      <span className="font-mono text-amber-700">{password}</span>
    </div>
  );
}