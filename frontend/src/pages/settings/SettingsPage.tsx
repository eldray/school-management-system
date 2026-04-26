import { useState, useEffect, useRef } from 'react';
import {
  Save, Loader2, Building2, Shield, GraduationCap, Plus, Edit,
  Trash2, X, Check, Star, Calendar, Upload, Award, Camera,
  Phone, Mail, MapPin, Globe, User, Clock, BookOpen, AlertCircle, ArrowRight,
  ChevronRight, TrendingUp, TrendingDown, CheckCircle, AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useSchoolSettings, useUpdateSchoolSettings } from '../../hooks/useSchoolSettings';
import { useTerms, useCreateTerm, useUpdateTerm, useDeleteTerm, useSetActiveTerm } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const termTypes = ['FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM'];
const termTypeLabels: Record<string, string> = {
  FIRST_TERM: 'First Term',
  SECOND_TERM: 'Second Term',
  THIRD_TERM: 'Third Term',
};
const examTypes = [
  { value: 'MID_TERM', label: 'Mid-Term Exams' },
  { value: 'END_OF_TERM', label: 'End of Term Exams' },
  { value: 'MOCK', label: 'Mock Exams' },
  { value: 'FINAL', label: 'Final Exams' },
];
const gradingSystems = [
  { value: 'STANDARD', label: 'Standard (A1–F9)' },
  { value: 'CUSTOM', label: 'Custom Grading Scale' },
];
const DEFAULT_GRADES = [
  { grade: 'A1', minScore: 80, maxScore: 100, remark: 'Excellent' },
  { grade: 'B2', minScore: 70, maxScore: 79, remark: 'Very Good' },
  { grade: 'B3', minScore: 65, maxScore: 69, remark: 'Good' },
  { grade: 'C4', minScore: 60, maxScore: 64, remark: 'Credit' },
  { grade: 'C5', minScore: 55, maxScore: 59, remark: 'Credit' },
  { grade: 'C6', minScore: 50, maxScore: 54, remark: 'Credit' },
  { grade: 'D7', minScore: 45, maxScore: 49, remark: 'Pass' },
  { grade: 'E8', minScore: 40, maxScore: 44, remark: 'Pass' },
  { grade: 'F9', minScore: 0,  maxScore: 39, remark: 'Fail' },
];
interface GradeConfig { grade: string; minScore: number; maxScore: number; remark: string; }

type Tab = 'general' | 'academic' | 'exams' | 'system';

const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'general',  icon: Building2,    label: 'General' },
  { id: 'academic', icon: GraduationCap, label: 'Academic' },
  { id: 'exams',    icon: Award,         label: 'Exams' },
  { id: 'system',   icon: Shield,        label: 'System' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSchoolSettings();
  const updateSettings = useUpdateSchoolSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: terms = [], isLoading: termsLoading } = useTerms();
  const createTerm   = useCreateTerm();
  const updateTerm   = useUpdateTerm();
  const deleteTerm   = useDeleteTerm();
  const setActiveTerm = useSetActiveTerm();

  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [form, setForm] = useState<any>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [termForm, setTermForm] = useState({
    name: '', type: 'FIRST_TERM',
    academicYear: new Date().getFullYear().toString(),
    startDate: '', endDate: '',
  });
  const [advancingYear, setAdvancingYear] = useState(false);
  const [progressionStatus, setProgressionStatus] = useState<any>(null);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdmin = canEdit;

  useEffect(() => {
    if (settings) {
      const d = { ...settings };
      if (!d.customGrades && d.gradingSystem === 'CUSTOM') d.customGrades = [...DEFAULT_GRADES];
      setForm(d);
      if (d.schoolLogo) {
        const logoUrl = d.schoolLogo.startsWith('http') 
          ? d.schoolLogo 
          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${d.schoolLogo}`;
        setLogoPreview(logoUrl);
      } else {
        setLogoPreview(null);
      }
    }
  }, [settings]);

  // Fetch progression status
  useEffect(() => {
    const fetchProgressionStatus = async () => {
      try {
        const res = await api.get('/exams/terms/progression-status');
        setProgressionStatus(res.data.data);
      } catch (error) {
        console.error('Failed to fetch progression status:', error);
      }
    };
    fetchProgressionStatus();
  }, []);

  const handleAdvanceAcademicYear = async () => {
    if (!confirm('⚠️ WARNING: Advancing to the next academic year will:\n\n' +
      '1. Create new terms for the next academic year\n' +
      '2. The current academic year will be archived\n' +
      '3. Make sure all student promotions are processed before continuing\n\n' +
      'Are you sure you want to proceed?')) {
      return;
    }
    
    setAdvancingYear(true);
    try {
      const res = await api.post('/school/academic-year/advance');
      alert(res.data.message);
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to advance academic year');
    } finally {
      setAdvancingYear(false);
    }
  };

  const handleManualTermAdvance = async () => {
    if (!confirm('Advance to the next term? This will:\n\n' +
      '1. Close the current term\n' +
      '2. Activate the next term\n\n' +
      'Are you sure?')) {
      return;
    }
    
    try {
      const res = await api.post('/school/terms/manual-advance');
      alert(res.data.message);
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to advance term');
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout title="Settings">
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Shield className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Access Restricted</h3>
          <p className="text-gray-400 text-sm">Only administrators can access settings.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (settingsLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { 
      alert('File size must be less than 2MB'); 
      return; 
    }
    if (!file.type.startsWith('image/')) { 
      alert('Only image files are allowed'); 
      return; 
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await api.post('/school/upload-logo', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      if (res.data.success) {
        const fullLogoUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${res.data.data.logoUrl}`;
        setForm({ ...form, schoolLogo: res.data.data.logoUrl });
        setLogoPreview(fullLogoUrl);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Upload failed');
      const originalLogo = form.schoolLogo;
      if (originalLogo) {
        const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${originalLogo}`;
        setLogoPreview(fullUrl);
      } else {
        setLogoPreview(null);
      }
    } finally { 
      setUploadingLogo(false); 
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    setForm({ ...form, schoolLogo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      await updateSettings.mutateAsync({ schoolLogo: '' });
    } catch (error) {
      alert('Failed to remove logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
      await updateSettings.mutateAsync(form); 
      alert('Settings saved successfully!'); 
    } catch (error) { 
      alert('Failed to save settings'); 
    }
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTerm) await updateTerm.mutateAsync({ id: editingTerm.id, data: termForm });
      else await createTerm.mutateAsync(termForm);
      setShowTermModal(false);
      setEditingTerm(null);
      setTermForm({ name: '', type: 'FIRST_TERM', academicYear: new Date().getFullYear().toString(), startDate: '', endDate: '' });
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const openEditTerm = (term: any) => {
    setEditingTerm(term);
    setTermForm({
      name: term.name, type: term.type, academicYear: term.academicYear,
      startDate: term.startDate.split('T')[0], endDate: term.endDate.split('T')[0],
    });
    setShowTermModal(true);
  };

  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Delete this term? Associated exams may be affected.')) return;
    try { await deleteTerm.mutateAsync(id); }
    catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] bg-white disabled:bg-gray-50 disabled:text-gray-400 transition-colors";
  const lbl = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

  const schoolInitials = (form.schoolName || 'SA').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  // Calculate days left percentage for progress bar
  const daysLeftPercentage = progressionStatus?.currentTerm?.daysLeft && progressionStatus?.currentTerm?.startDate
    ? Math.max(0, Math.min(100, (progressionStatus.currentTerm.daysLeft / 120) * 100))
    : 0;

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">School Settings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Configure school information and system preferences</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* LEFT PANEL - School identity card */}
          <div className="w-80 shrink-0 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-[#1a3d30] to-[#2a5d50]" />
              <div className="px-5 pb-5">
                <div className="relative -mt-14 mb-4">
                  <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md flex items-center justify-center">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="School Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Image failed to load:', logoPreview);
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#1a3d30] to-[#2a5d50] flex items-center justify-center">
                              <span class="text-white text-3xl font-bold">${schoolInitials}</span>
                            </div>`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a3d30] to-[#2a5d50] flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{schoolInitials}</span>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1a3d30] text-white rounded-full flex items-center justify-center hover:bg-[#153328] transition-colors shadow-md"
                    >
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
                <p className="font-bold text-gray-900 text-lg leading-tight">{form.schoolName || 'School Name'}</p>
                {form.schoolMotto && <p className="text-sm text-gray-400 italic mt-0.5">{form.schoolMotto}</p>}
                <div className="mt-4 space-y-2.5">
                  {form.schoolPhone && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-500">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      {form.schoolPhone}
                    </div>
                  )}
                  {form.schoolEmail && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-500">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      {form.schoolEmail}
                    </div>
                  )}
                  {form.schoolAddress && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      {form.schoolAddress}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="mt-5 flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a3d30] text-white rounded-xl text-sm font-medium hover:bg-[#153328] transition-colors">
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {logoPreview || form.schoolLogo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {(logoPreview || form.schoolLogo) && (
                      <button type="button" onClick={handleRemoveLogo}
                        className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Tab nav */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-[#1a3d30] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL - Form content */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit}>
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="mb-6 pb-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {TABS.find(t => t.id === activeTab)?.label} Settings
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {activeTab === 'general'  && 'School identity, contact details and branding'}
                    {activeTab === 'academic' && 'Academic year configuration and term management'}
                    {activeTab === 'exams'    && 'Grading scales, exam types and scoring defaults'}
                    {activeTab === 'system'   && 'Platform access and regional preferences'}
                  </p>
                </div>

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                  <div className="space-y-5 max-w-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className={lbl}>School Name</label>
                        <input type="text" value={form.schoolName || ''} onChange={e => setForm({ ...form, schoolName: e.target.value })} className={inp} disabled={!canEdit} required placeholder="e.g. Excellence Academy" />
                      </div>
                      <div>
                        <label className={lbl}>School Code</label>
                        <input type="text" value={form.schoolCode || ''} onChange={e => setForm({ ...form, schoolCode: e.target.value })} className={inp} disabled={!canEdit} placeholder="e.g. SMS001" />
                      </div>
                      <div>
                        <label className={lbl}>Established Year</label>
                        <input type="number" value={form.establishedYear || ''} onChange={e => setForm({ ...form, establishedYear: parseInt(e.target.value) || undefined })} className={inp} disabled={!canEdit} placeholder="e.g. 1995" />
                      </div>
                      <div className="col-span-2">
                        <label className={lbl}>School Motto</label>
                        <input type="text" value={form.schoolMotto || ''} onChange={e => setForm({ ...form, schoolMotto: e.target.value })} className={inp} disabled={!canEdit} placeholder="e.g. Excellence in Education" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Details</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={lbl}>Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input type="tel" value={form.schoolPhone || ''} onChange={e => setForm({ ...form, schoolPhone: e.target.value })} className={`${inp} pl-9`} disabled={!canEdit} placeholder="+233 300 000 000" />
                            </div>
                          </div>
                          <div>
                            <label className={lbl}>Email</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input type="email" value={form.schoolEmail || ''} onChange={e => setForm({ ...form, schoolEmail: e.target.value })} className={`${inp} pl-9`} disabled={!canEdit} placeholder="info@school.edu.gh" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>Address</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                            <textarea value={form.schoolAddress || ''} onChange={e => setForm({ ...form, schoolAddress: e.target.value })} className={`${inp} pl-9 resize-none h-20`} disabled={!canEdit} placeholder="123 Education Lane, Accra, Ghana" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Leadership</p>
                      <div>
                        <label className={lbl}>Principal / Head Teacher Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input type="text" value={form.principalName || ''} onChange={e => setForm({ ...form, principalName: e.target.value })} className={`${inp} pl-9`} disabled={!canEdit} placeholder="Full name" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ACADEMIC TAB */}
                {activeTab === 'academic' && (
                  <div className="space-y-6">
                    {/* Two-column layout for Academic Settings */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left column - Settings Form */}
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={lbl}>Current Academic Year</label>
                            <input type="text" value={form.currentAcademicYear || ''} onChange={e => setForm({ ...form, currentAcademicYear: e.target.value })} className={inp} disabled={!canEdit} placeholder="2024/2025" />
                            <p className="text-xs text-gray-400 mt-1">Format: YYYY/YYYY (e.g., 2024/2025)</p>
                          </div>
                          <div>
                            <label className={lbl}>Default Term</label>
                            <select value={form.defaultTermType || 'FIRST_TERM'} onChange={e => setForm({ ...form, defaultTermType: e.target.value })} className={inp} disabled={!canEdit}>
                              {termTypes.map(t => <option key={t} value={t}>{termTypeLabels[t]}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">Academic Terms</p>
                              <p className="text-xs text-gray-400 mt-0.5">{terms.length} term{terms.length !== 1 ? 's' : ''} configured</p>
                            </div>
                            {canEdit && (
                              <button type="button"
                                onClick={() => { setEditingTerm(null); setTermForm({ name: '', type: 'FIRST_TERM', academicYear: form.currentAcademicYear || new Date().getFullYear().toString(), startDate: '', endDate: '' }); setShowTermModal(true); }}
                                className="flex items-center gap-1.5 text-xs bg-[#1a3d30] text-white px-3 py-2 rounded-lg hover:bg-[#153328] transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Add Term
                              </button>
                            )}
                          </div>

                          {termsLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#1a3d30]" /></div>
                          ) : terms.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-400 text-sm">No terms defined yet</p>
                              <p className="text-xs text-gray-400 mt-1">Create terms for the academic year</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                              {(terms as any[]).map((term) => (
                                <div key={term.id} className={`rounded-xl p-4 border transition-all ${term.isActive ? 'border-[#1a3d30] bg-[#f0f7f4]' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      {term.isActive
                                        ? <span className="mt-0.5 w-5 h-5 rounded-full bg-[#1a3d30] flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></span>
                                        : <span className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                                      }
                                      <div>
                                        <p className="font-semibold text-gray-800 text-sm">{term.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {termTypeLabels[term.type]} · {term.academicYear}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {formatDate(term.startDate)} – {formatDate(term.endDate)}
                                        </p>
                                        {term._count?.exams > 0 && (
                                          <p className="text-xs text-[#1a3d30] mt-1 font-medium">{term._count.exams} exam{term._count.exams !== 1 ? 's' : ''} scheduled</p>
                                        )}
                                      </div>
                                    </div>
                                    {canEdit && (
                                      <div className="flex items-center gap-1">
                                        {!term.isActive && (
                                          <button type="button" onClick={() => setActiveTerm.mutate(term.id)}
                                            className="p-1.5 text-[#1a3d30] hover:bg-[#1a3d30]/10 rounded-lg transition-colors" title="Set active">
                                            <Star className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button type="button" onClick={() => openEditTerm(term)} className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors">
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button type="button" onClick={() => handleDeleteTerm(term.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right column - Academic Year Status Card */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 h-fit">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Academic Year</p>
                            <p className="text-lg font-bold text-gray-800">{form.currentAcademicYear || '—'}</p>
                          </div>
                        </div>

                        {/* Term Progression Timeline */}
                        {progressionStatus?.hasActiveTerm && progressionStatus.currentTerm && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">Current Term</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                progressionStatus.currentTerm.isEnded 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {progressionStatus.currentTerm.isEnded ? 'Ended' : `${progressionStatus.currentTerm.daysLeft} days left`}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-800">{progressionStatus.currentTerm.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(progressionStatus.currentTerm.startDate)} - {formatDate(progressionStatus.currentTerm.endDate)}
                            </p>
                            
                            {/* Progress Bar */}
                            {!progressionStatus.currentTerm.isEnded && (
                              <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${100 - (progressionStatus.currentTerm.daysLeft / 120 * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Next Action Preview */}
                        {progressionStatus && (
                          <div className="mb-4 p-3 bg-white/60 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <ChevronRight className="w-3 h-3 text-amber-600" />
                              <span className="text-xs font-medium text-gray-500">Next Action</span>
                            </div>
                            {progressionStatus.nextAction === 'ADVANCE_TERM' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Advance to next term</span>
                                <button
                                  type="button"
                                  onClick={handleManualTermAdvance}
                                  className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors"
                                >
                                  Advance Now
                                </button>
                              </div>
                            )}
                            {progressionStatus.nextAction === 'ADVANCE_ACADEMIC_YEAR' && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Advance academic year</span>
                                <span className="text-xs text-amber-600">Ready to advance</span>
                              </div>
                            )}
                            {progressionStatus.nextAction === 'WAITING' && progressionStatus.currentTerm && !progressionStatus.currentTerm.isEnded && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">Next term starts after current ends</span>
                              </div>
                            )}
                            {!progressionStatus?.hasActiveTerm && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">No active term. Set a term as active to begin.</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Advance Button */}
                        <button
                          type="button"
                          onClick={handleAdvanceAcademicYear}
                          disabled={advancingYear}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                          {advancingYear ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          Advance to Next Academic Year
                        </button>
                        <p className="text-xs text-amber-600 mt-2 text-center">
                          After 3rd term ends, advance to {form.currentAcademicYear ? 
                            `${parseInt(form.currentAcademicYear.split('/')[1])}/${parseInt(form.currentAcademicYear.split('/')[1]) + 1}` : 
                            'next year'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXAMS TAB */}
                {activeTab === 'exams' && (
                  <div className="space-y-5 max-w-xl">
                    <div>
                      <label className={lbl}>Grading System</label>
                      <select value={form.gradingSystem || 'STANDARD'} onChange={e => {
                        const v = e.target.value;
                        setForm({ ...form, gradingSystem: v, customGrades: v === 'CUSTOM' && !form.customGrades ? [...DEFAULT_GRADES] : form.customGrades });
                      }} className={inp} disabled={!canEdit}>
                        {gradingSystems.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>

                    {form.gradingSystem === 'CUSTOM' && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-700">Custom Grading Scale</p>
                          {canEdit && (
                            <button type="button" onClick={() => {
                              setForm({ ...form, customGrades: [...(form.customGrades || DEFAULT_GRADES), { grade: '', minScore: 0, maxScore: 100, remark: '' }] });
                            }} className="text-xs text-[#1a3d30] font-medium hover:underline">
                              + Add row
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          <div className="grid grid-cols-12 gap-1.5 px-1 mb-1">
                            {['Grade', 'Min', 'Max', 'Remark', ''].map(h => (
                              <span key={h} className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${h === 'Remark' ? 'col-span-4' : h === '' ? 'col-span-1' : 'col-span-2'} ${h === 'Grade' ? 'col-span-3' : ''}`}>{h}</span>
                            ))}
                          </div>
                          {(form.customGrades || DEFAULT_GRADES).map((g: GradeConfig, i: number) => (
                            <div key={i} className="grid grid-cols-12 gap-1.5 items-center bg-white rounded-lg p-1.5 border border-gray-100">
                              <input type="text" value={g.grade} onChange={e => { const gs = [...(form.customGrades || DEFAULT_GRADES)]; gs[i] = { ...gs[i], grade: e.target.value }; setForm({ ...form, customGrades: gs }); }}
                                className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1a3d30]" disabled={!canEdit} placeholder="A1" />
                              <input type="number" value={g.minScore} onChange={e => { const gs = [...(form.customGrades || DEFAULT_GRADES)]; gs[i] = { ...gs[i], minScore: parseInt(e.target.value) || 0 }; setForm({ ...form, customGrades: gs }); }}
                                className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1a3d30]" disabled={!canEdit} />
                              <input type="number" value={g.maxScore} onChange={e => { const gs = [...(form.customGrades || DEFAULT_GRADES)]; gs[i] = { ...gs[i], maxScore: parseInt(e.target.value) || 100 }; setForm({ ...form, customGrades: gs }); }}
                                className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1a3d30]" disabled={!canEdit} />
                              <input type="text" value={g.remark} onChange={e => { const gs = [...(form.customGrades || DEFAULT_GRADES)]; gs[i] = { ...gs[i], remark: e.target.value }; setForm({ ...form, customGrades: gs }); }}
                                className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#1a3d30]" disabled={!canEdit} placeholder="Remark" />
                              {canEdit && (
                                <button type="button" onClick={() => setForm({ ...form, customGrades: (form.customGrades || DEFAULT_GRADES).filter((_: any, j: number) => j !== i) })}
                                  className="col-span-1 p-1 text-red-400 hover:bg-red-50 rounded flex items-center justify-center">
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={lbl}>Passing Mark (%)</label>
                        <input type="number" min="0" max="100" value={form.defaultPassingMarks || 40} onChange={e => setForm({ ...form, defaultPassingMarks: parseInt(e.target.value) || 40 })} className={inp} disabled={!canEdit} />
                      </div>
                      <div>
                        <label className={lbl}>Total Marks</label>
                        <input type="number" min="1" value={form.defaultTotalMarks || 100} onChange={e => setForm({ ...form, defaultTotalMarks: parseInt(e.target.value) || 100 })} className={inp} disabled={!canEdit} />
                      </div>
                      <div>
                        <label className={lbl}>Duration (min)</label>
                        <input type="number" min="30" step="15" value={form.defaultExamDuration || 60} onChange={e => setForm({ ...form, defaultExamDuration: parseInt(e.target.value) || 60 })} className={inp} disabled={!canEdit} />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Enabled Exam Types</p>
                      <div className="grid grid-cols-2 gap-2">
                        {examTypes.map(type => (
                          <label key={type.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.enabledExamTypes?.[type.value] !== false ? 'border-[#1a3d30] bg-[#f0f7f4]' : 'border-gray-200 bg-gray-50'}`}>
                            <input type="checkbox" checked={form.enabledExamTypes?.[type.value] !== false}
                              onChange={e => setForm({ ...form, enabledExamTypes: { ...form.enabledExamTypes, [type.value]: e.target.checked } })}
                              disabled={!canEdit} className="w-3.5 h-3.5 accent-[#1a3d30]" />
                            <span className="text-sm text-gray-700 font-medium">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SYSTEM TAB */}
                {activeTab === 'system' && (
                  <div className="space-y-5 max-w-xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Default Language</label>
                        <select value={form.defaultLanguage || 'en'} onChange={e => setForm({ ...form, defaultLanguage: e.target.value })} className={inp} disabled={!canEdit}>
                          <option value="en">English</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Timezone</label>
                        <select value={form.timezone || 'Africa/Accra'} onChange={e => setForm({ ...form, timezone: e.target.value })} className={inp} disabled={!canEdit}>
                          <option value="Africa/Accra">Africa/Accra (GMT)</option>
                          <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                          <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Portal Access</p>
                      <div className="space-y-2">
                        {[
                          { key: 'allowParentLogin', label: 'Allow Parent Login', desc: 'Parents can log in to view student progress' },
                          { key: 'allowStudentLogin', label: 'Allow Student Login', desc: 'Students can log in to view their results' },
                        ].map(({ key, label, desc }) => (
                          <label key={key} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form[key] !== false ? 'border-[#1a3d30] bg-[#f0f7f4]' : 'border-gray-200 bg-gray-50'}`}>
                            <input type="checkbox" checked={form[key] !== false} onChange={e => setForm({ ...form, [key]: e.target.checked })}
                              disabled={!canEdit} className="w-4 h-4 mt-0.5 accent-[#1a3d30]" />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save button */}
                {activeTab !== 'academic' && canEdit && (
                  <div className="flex justify-end pt-6 border-t border-gray-100 mt-6">
                    <button type="submit" disabled={updateSettings.isPending}
                      className="flex items-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#153328] disabled:opacity-50 transition-colors">
                      {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Term Modal - Enhanced Design */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{editingTerm ? 'Edit Term' : 'Add New Term'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingTerm ? 'Update term details' : 'Create a new academic term'}
                </p>
              </div>
              <button type="button" onClick={() => setShowTermModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleTermSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Term Name</label>
                <input
                  type="text"
                  placeholder="e.g., First Term 2024/2025"
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-2 focus:ring-[#1a3d30]/20 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Term Type</label>
                  <select
                    value={termForm.type}
                    onChange={(e) => setTermForm({ ...termForm, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-2 focus:ring-[#1a3d30]/20 transition-all"
                    required
                  >
                    {termTypes.map(t => (
                      <option key={t} value={t}>{termTypeLabels[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
                  <input
                    type="text"
                    placeholder="2024/2025"
                    value={termForm.academicYear}
                    onChange={(e) => setTermForm({ ...termForm, academicYear: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-2 focus:ring-[#1a3d30]/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={termForm.startDate}
                    onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-2 focus:ring-[#1a3d30]/20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={termForm.endDate}
                    onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3d30] focus:ring-2 focus:ring-[#1a3d30]/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1a3d30] text-white rounded-xl text-sm font-medium hover:bg-[#153328] transition-colors"
                >
                  {editingTerm ? 'Save Changes' : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}