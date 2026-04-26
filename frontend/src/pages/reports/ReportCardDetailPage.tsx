import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Loader2, Award, Calendar, User, Phone, Mail, MapPin, Edit, Save, X, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useReactToPrint } from 'react-to-print';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import { useTerms } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';
import api from '../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ReportCardDetailPage() {
  const { studentId, termId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTerm, setSelectedTerm] = useState(termId || '');
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [principalRemarks, setPrincipalRemarks] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const { data: settings } = useSchoolSettings();
  const { data: terms = [] } = useTerms();
  const { data: teacherClassesData } = useTeacherAccessibleClasses();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isParent = user?.role === 'PARENT';
  const isStudentRole = user?.role === 'STUDENT';

  // Determine if user can edit teacher remarks (Class Teachers only, not Subject Teachers)
  const canEditTeacherRemarks = isAdmin || (isTeacher && teacherClassesData?.some((c: any) => 
    c.accessType === 'CLASS_TEACHER'
  ));
  
  const canEditPrincipalRemarks = isAdmin;
  const canViewReport = isAdmin || isParent || isStudentRole || isTeacher;

  // Fetch real report card data
  const { data: reportCard, isLoading, error } = useQuery({
    queryKey: ['report-card', studentId, selectedTerm],
    queryFn: async () => {
      try {
        const res = await api.get(`/report-cards/student/${studentId}/term/${selectedTerm}`);
        return res.data.data;
      } catch (err: any) {
        if (err.response?.status === 403) {
          setPermissionError(err.response?.data?.message || 'You do not have permission to view this report card');
        }
        throw err;
      }
    },
    enabled: !!studentId && !!selectedTerm && canViewReport,
  });

  // Update remarks mutation
  const updateRemarksMutation = useMutation({
    mutationFn: async (data: { teacherRemarks?: string; principalRemarks?: string }) => {
      const res = await api.put(`/report-cards/${reportCard?.id}/remarks`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-card', studentId, selectedTerm] });
      setIsEditingRemarks(false);
      alert('Remarks saved successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to save remarks');
    },
  });

  useEffect(() => {
    if (reportCard) {
      setTeacherRemarks(reportCard.teacherRemarks || '');
      setPrincipalRemarks(reportCard.principalRemarks || '');
    }
  }, [reportCard]);

  const handleSaveRemarks = () => {
    const data: any = {};
    if (canEditTeacherRemarks) data.teacherRemarks = teacherRemarks;
    if (canEditPrincipalRemarks) data.principalRemarks = principalRemarks;
    updateRemarksMutation.mutate(data);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Report Card - ${reportCard?.student?.name || 'Student'} - ${reportCard?.term?.name || 'Term'}`,
  });

  const getGradeColor = (grade: string) => {
    if (!grade) return 'text-gray-600';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D') || grade.startsWith('E')) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPositionSuffix = (position: number) => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  };

  // Show permission error
  if (permissionError) {
    return (
      <DashboardLayout title="Report Card">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-700 mb-4">{permissionError}</p>
          <button
            onClick={() => navigate('/report-cards')}
            className="px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Report Cards
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Report Card">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!reportCard) {
    return (
      <DashboardLayout title="Report Card">
        <div className="text-center py-12">
          <p className="text-gray-500">Report card not found for this term.</p>
          <button
            onClick={() => navigate('/report-cards')}
            className="mt-4 px-4 py-2 bg-[#1a3d30] text-white rounded-lg text-sm hover:bg-[#153328]"
          >
            Back to Report Cards
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (date: string) => {
    if (!date) return 'TBA';
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <DashboardLayout title="Report Card">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between print:hidden">
          <button onClick={() => navigate('/report-cards')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to Report Cards
          </button>
          <div className="flex items-center gap-3">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {terms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
            </select>
            <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button 
              onClick={() => window.open(`/api/report-cards/${studentId}/${selectedTerm}/pdf`, '_blank')}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Info Banner for Teachers about remarks */}
        {isTeacher && !canEditTeacherRemarks && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 print:hidden">
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              You can view this report card but cannot edit remarks. Only Class Teachers can add/edit remarks.
            </p>
          </div>
        )}

        {isTeacher && canEditTeacherRemarks && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 print:hidden">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              As a Class Teacher, you can add/edit remarks for this student.
            </p>
          </div>
        )}

        {/* Printable Report Card */}
        <div ref={printRef} className="bg-white p-6">
          {/* School Header */}
          <div className="text-center border-b-2 border-[#1a3d30] pb-4 mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              {reportCard.school?.logo && <img src={reportCard.school.logo} alt="Logo" className="w-16 h-16 object-contain" />}
              <div>
                <h1 className="text-2xl font-bold text-[#1a3d30] uppercase">{reportCard.school?.name || settings?.schoolName}</h1>
                <p className="text-sm text-gray-600 italic">{reportCard.school?.motto || settings?.schoolMotto}</p>
              </div>
            </div>
            <div className="flex justify-center gap-6 text-xs text-gray-500">
              {reportCard.school?.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {reportCard.school.address}</span>}
              {reportCard.school?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {reportCard.school.phone}</span>}
              {reportCard.school?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {reportCard.school.email}</span>}
            </div>
          </div>

          {/* Report Card Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#1a3d30] uppercase">Student Report Card</h2>
            <p className="text-sm text-gray-600">{reportCard.term?.name} • {reportCard.term?.academicYear}</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Student Name</p>
              <p className="font-bold text-base">{reportCard.student?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Admission Number</p>
              <p className="font-medium font-mono">{reportCard.student?.admissionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Class</p>
              <p className="font-medium">{reportCard.student?.class}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Position in Class</p>
              <p className="font-bold text-lg text-[#1a3d30]">
                {reportCard.overallPosition ? (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {reportCard.overallPosition}{getPositionSuffix(reportCard.overallPosition)} out of {reportCard.classSize}
                  </span>
                ) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Guardian</p>
              <p className="font-medium">{reportCard.student?.guardian}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Promotion Status</p>
              <p className={`font-medium flex items-center gap-1 ${reportCard.promotionStatus === 'PROMOTED' ? 'text-green-600' : 'text-amber-600'}`}>
                {reportCard.promotionStatus === 'PROMOTED' ? (
                  <><CheckCircle className="w-4 h-4" /> Promoted to {reportCard.nextClass}</>
                ) : reportCard.promotionStatus === 'REPEATED' ? (
                  'To Repeat'
                ) : 'Pending'}
              </p>
            </div>
          </div>

          {/* Grades Table */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Academic Performance</h3>
            <table className="w-full border-collapse">
              <thead className="bg-[#1a3d30] text-white">
                <tr>
                  <th className="border border-[#2a5d50] px-3 py-2 text-left text-sm">Subject</th>
                  <th className="border border-[#2a5d50] px-3 py-2 text-center text-sm">Position</th>
                  <th className="border border-[#2a5d50] px-3 py-2 text-center text-sm">Assessments</th>
                  <th className="border border-[#2a5d50] px-3 py-2 text-center text-sm">Exam Score</th>
                  <th className="border border-[#2a5d50] px-3 py-2 text-center text-sm">Term Grade</th>
                  <th className="border border-[#2a5d50] px-3 py-2 text-left text-sm">Remark</th>
                </tr>
              </thead>
              <tbody>
                {reportCard.subjects?.map((subject: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="border border-gray-300 px-3 py-2 font-medium">{subject.subject}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {subject.position ? (
                        <span className="font-medium">
                          {subject.position}{getPositionSuffix(subject.position)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {subject.assessments?.map((a: any, i: number) => (
                        <div key={i} className="text-xs">
                          {a.type}: {a.score}/{a.total}
                        </div>
                      ))}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className={getGradeColor(subject.examGrade)}>
                        {subject.examScore}% ({subject.examGrade})
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                      <span className={getGradeColor(subject.termRemark)}>
                        {subject.termGrade}%
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{subject.termRemark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Overall Average</p>
              <p className="text-3xl font-bold text-[#1a3d30]">{reportCard.overallAverage?.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Grade: {reportCard.overallGrade}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Attendance</p>
              <p className="text-2xl font-bold">{reportCard.attendance?.present}/{reportCard.attendance?.total} days</p>
              <p className="text-sm text-gray-600">{reportCard.attendance?.percentage?.toFixed(1)}% attendance rate</p>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="space-y-3 mb-6">
            {/* Teacher Remarks */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Class Teacher's Remarks:</p>
                {canEditTeacherRemarks && !isEditingRemarks && (
                  <button
                    onClick={() => setIsEditingRemarks(true)}
                    className="print:hidden flex items-center gap-1 text-xs text-[#1a3d30] hover:underline"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                )}
                {isEditingRemarks && canEditTeacherRemarks && (
                  <div className="print:hidden flex items-center gap-2">
                    <button
                      onClick={handleSaveRemarks}
                      disabled={updateRemarksMutation.isPending}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingRemarks(false);
                        setTeacherRemarks(reportCard.teacherRemarks || '');
                      }}
                      className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
              </div>
              {isEditingRemarks && canEditTeacherRemarks ? (
                <textarea
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none"
                  rows={3}
                  placeholder="Enter teacher's remarks..."
                />
              ) : (
                <p className="text-gray-700 italic">"{reportCard.teacherRemarks || 'No remarks yet.'}"</p>
              )}
            </div>

            {/* Principal Remarks */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Principal's Remarks:</p>
                {canEditPrincipalRemarks && !isEditingRemarks && (
                  <button
                    onClick={() => {
                      setIsEditingRemarks(true);
                      setPrincipalRemarks(reportCard.principalRemarks || '');
                    }}
                    className="print:hidden flex items-center gap-1 text-xs text-[#1a3d30] hover:underline"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              {isEditingRemarks && canEditPrincipalRemarks ? (
                <textarea
                  value={principalRemarks}
                  onChange={(e) => setPrincipalRemarks(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none"
                  rows={3}
                  placeholder="Enter principal's remarks..."
                />
              ) : (
                <p className="text-gray-700 italic">"{reportCard.principalRemarks || 'No remarks yet.'}"</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
            <p className="font-medium">
              📅 Next Term Begins: {formatDate(reportCard.nextTermDate)}
            </p>
            {reportCard.promotionStatus === 'PROMOTED' && (
              <p className="mt-1 text-green-600">
                ✅ Promoted to {reportCard.nextClass} for the {reportCard.nextTermName || 'next term'}
              </p>
            )}
            <p className="mt-2">This is an official report card of {reportCard.school?.name || settings?.schoolName}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}