import { useState, useMemo, useRef } from 'react';
import { Calendar, Printer, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useExams, useTerms } from '../../hooks/useExams';
import { useAuth } from '../../context/AuthContext';
import { useTeacherExamOptions } from '../../hooks/useExams';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import { useReactToPrint } from 'react-to-print';

const EXAM_TYPE_META: Record<string, { label: string }> = {
  MID_TERM:    { label: 'Mid-Term Examination' },
  END_OF_TERM: { label: 'End of Term Examination' },
  MOCK:        { label: 'Mock Examination' },
  FINAL:       { label: 'Final Examination' },
};

function formatTime(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatDateCol(dateStr: string) {
  const d = new Date(dateStr);
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    year: d.getFullYear(),
  };
}

// ── Inline SVG icons for print (no external deps) ──
const PhoneIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.03 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
  </svg>
);
const MailIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: 4 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline', marginRight: 3 }}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

function ExamTypePrintout({
  examType, examsForType, sortedClassNames,
  availableClasses, schoolName, schoolMotto,
  schoolInitials, settings, currentTermLabel,
}: any) {
  const printRef = useRef<HTMLDivElement>(null);
  const meta = EXAM_TYPE_META[examType] || { label: 'Examination' };

  // Build matrix: className → dateStr → subjects[]
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, any[]>> = {};
    examsForType.forEach((exam: any) => {
      exam.examSubjects?.forEach((subject: any) => {
        if (!availableClasses.find((c: any) => c.id === subject.classId)) return;
        const dateStr = (subject.examDate || '').split('T')[0];
        const className = subject.class?.name || 'Unknown';
        if (!m[className]) m[className] = {};
        if (!m[className][dateStr]) m[className][dateStr] = [];
        m[className][dateStr].push({ ...subject, examType: exam.type });
      });
    });
    return m;
  }, [examsForType, availableClasses]);

  // All unique dates across all classes, sorted
  const sortedDates = useMemo(() => {
    const dateSet = new Set<string>();
    Object.values(matrix).forEach(classDates => {
      Object.keys(classDates).forEach(d => dateSet.add(d));
    });
    return Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [matrix]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${schoolName} - ${meta.label} Timetable`,
    pageStyle: `
      @page { size: landscape; margin: 0.4in; }
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        table { page-break-inside: avoid; }
      }
    `,
  });

  if (sortedDates.length === 0) return null;

  const startDate = formatDateCol(sortedDates[0]);
  const endDate = formatDateCol(sortedDates[sortedDates.length - 1]);
  const dateRange = sortedDates.length === 1
    ? startDate.full
    : `${startDate.short} – ${endDate.short}, ${endDate.year}`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Screen-only header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 print:hidden">
        <div>
          <h3 className="font-bold text-gray-900 text-base">{meta.label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {dateRange} · {sortedDates.length} exam day{sortedDates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => handlePrint()}
          className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#153328] transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Printable area */}
      <div ref={printRef}>

        {/* ── Letterhead (print only) ── */}
        <div style={{ display: 'none' }} className="print:block">
          <div style={{ padding: '0 0 16px', borderBottom: '3px solid #1a3d30', marginBottom: 18 }}>
            {/* Logo + School name row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
              {settings?.schoolLogo ? (
                <img src={settings.schoolLogo} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1a3d30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{schoolInitials}</span>
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a3d30', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.15 }}>
                  {schoolName}
                </p>
                {schoolMotto && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>{schoolMotto}</p>
                )}
              </div>
            </div>

            {/* Contact row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 11, color: '#6b7280' }}>
              {settings?.schoolPhone && <span><PhoneIcon />{settings.schoolPhone}</span>}
              {settings?.schoolEmail && <span><MailIcon />{settings.schoolEmail}</span>}
              {settings?.schoolAddress && <span><PinIcon />{settings.schoolAddress}</span>}
            </div>

            {/* Exam title centred */}
            <div style={{ textAlign: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a3d30', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {meta.label}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                {currentTermLabel} &nbsp;·&nbsp; {dateRange}
              </p>
            </div>
          </div>
        </div>

        {/* ── Timetable table: rows = classes, cols = dates ── */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr>
                {/* Corner cell */}
                <th style={{
                  background: '#1a3d30', color: 'white',
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  borderRight: '1px solid rgba(255,255,255,0.18)',
                  minWidth: 110, whiteSpace: 'nowrap',
                }}>
                  Class / Date
                </th>

                {/* One column per exam date */}
                {sortedDates.map(dateStr => {
                  const { weekday, date } = formatDateCol(dateStr);
                  return (
                    <th key={dateStr} style={{
                      background: '#1a3d30', color: 'white',
                      padding: '10px 12px', textAlign: 'center',
                      borderRight: '1px solid rgba(255,255,255,0.18)',
                      minWidth: 110,
                    }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{weekday}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, opacity: 0.75, fontWeight: 400 }}>{date}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {sortedClassNames.map((className: string, rowIdx: number) => {
                const rowBg = rowIdx % 2 === 0 ? 'white' : '#f8faf8';
                const classDates = matrix[className] || {};

                return (
                  <tr key={className}>
                    {/* Class name cell */}
                    <td style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#f0f7f4',
                      verticalAlign: 'middle',
                      whiteSpace: 'nowrap',
                    }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a3d30' }}>
                        {className}
                      </p>
                    </td>

                    {/* One cell per date */}
                    {sortedDates.map(dateStr => {
                      const subjects = classDates[dateStr] || [];
                      return (
                        <td key={dateStr} style={{
                          padding: '8px 8px',
                          borderRight: '1px solid #e5e7eb',
                          borderBottom: '1px solid #e5e7eb',
                          background: subjects.length > 0 ? rowBg : rowBg,
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          minWidth: 110,
                        }}>
                          {subjects.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {subjects.map((s: any, idx: number) => (
                                <div key={idx} style={{
                                  background: '#e8f3ef',
                                  border: '1px solid #b8d9cc',
                                  borderRadius: 6,
                                  padding: '5px 7px',
                                }}>
                                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1a3d30', lineHeight: 1.3 }}>
                                    {s.subject?.name || '—'}
                                  </p>
                                  {s.startTime && (
                                    <p style={{ margin: '2px 0 0', fontSize: 10, color: '#2d6a52' }}>
                                      <ClockIcon />
                                      {formatTime(s.startTime)}
                                      {s.duration ? ` · ${s.duration}m` : ''}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: 15, lineHeight: 1 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Print footer ── */}
        <div style={{ display: 'none' }} className="print:block">
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11, color: '#9ca3af' }}>
            <div>
              <p style={{ margin: 0 }}>
                Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 10 }}>
                This is an official document of {schoolName}. Unauthorized reproduction is prohibited.
              </p>
            </div>
            {settings?.principalName && (
              <div style={{ textAlign: 'center', minWidth: 160 }}>
                <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 4 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: 12 }}>{settings.principalName}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10 }}>Principal / Head Teacher</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState('ALL');
  const [selectedExamType, setSelectedExamType] = useState('ALL');

  const { data: exams = [], isLoading } = useExams();
  const { data: terms = [] } = useTerms();
  const { data: teacherOptions } = useTeacherExamOptions();
  const { data: settings } = useSchoolSettings();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  const activeTerm = terms.find((t: any) => t.isActive);
  const schoolName = settings?.schoolName || 'Excellence Academy';
  const schoolMotto = settings?.schoolMotto || 'Excellence in Education';
  const schoolInitials = schoolName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const allClasses = useMemo(() => {
    const map = new Map();
    exams.forEach((exam: any) => {
      exam.examSubjects?.forEach((s: any) => {
        if (s.class && !map.has(s.class.id)) map.set(s.class.id, s.class);
      });
    });
    return Array.from(map.values()).sort((a: any, b: any) =>
      parseInt(a.name.match(/\d+/)?.[0] || '0') - parseInt(b.name.match(/\d+/)?.[0] || '0')
    );
  }, [exams]);

  const availableClasses = useMemo(() => {
    if (isAdmin) return allClasses;
    if (isTeacher && teacherOptions) {
      const ids = new Set([
        ...(teacherOptions.classTeacherClasses?.map((c: any) => c.id) || []),
        ...(teacherOptions.subjectTeacherOptions?.map((s: any) => s.classId) || []),
      ]);
      return allClasses.filter((c: any) => ids.has(c.id));
    }
    if (isStudent && (user as any)?.student?.class)
      return allClasses.filter((c: any) => c.id === (user as any).student?.class?.id);
    if (isParent) {
      const ids = (user as any)?.parentProfile?.students?.map((s: any) => s.classId) || [];
      return allClasses.filter((c: any) => ids.includes(c.id));
    }
    return allClasses;
  }, [allClasses, isAdmin, isTeacher, isStudent, isParent, teacherOptions, user]);

  const sortedClassNames = useMemo(() =>
    availableClasses.map((c: any) => c.name).sort((a: string, b: string) => {
      const ag = parseInt(a.match(/\d+/)?.[0] || '0');
      const bg = parseInt(b.match(/\d+/)?.[0] || '0');
      return ag !== bg ? ag - bg : a.localeCompare(b);
    }),
    [availableClasses]
  );

  const filteredExams = useMemo(() =>
    exams.filter((e: any) => selectedTerm === 'ALL' || e.termId === selectedTerm),
    [exams, selectedTerm]
  );

  const examsByType = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredExams.forEach((exam: any) => {
      const type = exam.type || 'FINAL';
      if (!groups[type]) groups[type] = [];
      groups[type].push(exam);
    });
    return groups;
  }, [filteredExams]);

  const examTypes = useMemo(() => {
    const order = ['MID_TERM', 'END_OF_TERM', 'MOCK', 'FINAL'];
    return Object.keys(examsByType).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [examsByType]);

  const displayTypes = selectedExamType === 'ALL'
    ? examTypes
    : examTypes.filter(t => t === selectedExamType);

  const currentTermLabel = selectedTerm === 'ALL'
    ? (activeTerm?.name || 'All Terms')
    : (terms.find((t: any) => t.id === selectedTerm) as any)?.name || 'All Terms';

  if (isLoading) {
    return (
      <DashboardLayout title="Exam Timetable">
        <div className="flex justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Exam Timetable">
      <div className="space-y-6">

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exam Timetable</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {currentTermLabel} · {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none"
            >
              <option value="ALL">All Terms</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={selectedExamType}
              onChange={e => setSelectedExamType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none"
            >
              <option value="ALL">All Exam Types</option>
              {Object.entries(EXAM_TYPE_META).map(([type, m]) => (
                <option key={type} value={type}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Blocks */}
        {displayTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No exams scheduled</p>
            <p className="text-gray-400 text-sm mt-1">Exam schedule will appear here once created</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayTypes.map(examType => (
              <ExamTypePrintout
                key={examType}
                examType={examType}
                examsForType={examsByType[examType] || []}
                sortedClassNames={sortedClassNames}
                availableClasses={availableClasses}
                schoolName={schoolName}
                schoolMotto={schoolMotto}
                schoolInitials={schoolInitials}
                settings={settings}
                currentTermLabel={currentTermLabel}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}