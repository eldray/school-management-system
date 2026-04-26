import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import AddStudentPage from './pages/students/AddStudentPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import UsersPage from './pages/users/UsersPage';
import ClassesPage from './pages/classes/ClassesPage';
import AddClassPage from './pages/classes/AddClassPage';
import ClassDetailPage from './pages/classes/ClassDetailPage';
import ExamsPage from './pages/exams/ExamsPage';
import CreateExamPage from './pages/exams/CreateExamPage';
import TermsPage from './pages/exams/TermsPage';
import SubjectsPage from './pages/exams/SubjectsPage';
import ExamDetailPage from './pages/exams/ExamDetailPage';
import ResultsEntryPage from './pages/exams/ResultsEntryPage';
import TimetablePage from './pages/exams/TimetablePage';
import FeesPage from './pages/fees/FeesPage';
import FeeTypesPage from './pages/fees/FeeTypesPage';
import FeeTemplatesPage from './pages/fees/FeeTemplatesPage';
import AssignFeesPage from './pages/fees/AssignFeesPage';
import RecordPaymentPage from './pages/fees/RecordPaymentPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import AddAnnouncementPage from './pages/announcements/AddAnnouncementPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AssessmentsPage from './pages/assessments/AssessmentsPage';
import AddAssessmentPage from './pages/assessments/AddAssessmentPage';
import AssessmentScoresPage from './pages/assessments/AssessmentScoresPage';
import ReportCardsPage from './pages/reports/ReportCardsPage';
import ReportCardDetailPage from './pages/reports/ReportCardDetailPage';
import PromotionPage from './pages/promotions/PromotionPage';
import EditStudentPage from './pages/students/EditStudentPage';
import ReceiptDetailPage from './pages/fees/ReceiptDetailPage';
import StudentFeesPage from './pages/fees/StudentFeesPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import AddEmployeePage from './pages/employees/AddEmployeePage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import EditEmployeePage from './pages/employees/EditEmployeePage';


const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3d30]"></div>
      </div>
    );
  }
  
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// App Routes Component
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Student Routes */}
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/students/add" element={<ProtectedRoute><AddStudentPage /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
      <Route path="/students/:id/edit" element={<ProtectedRoute><EditStudentPage /></ProtectedRoute>} />
      
      {/* User Routes */}
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      
      {/* Class Routes */}
      <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
      <Route path="/classes/add" element={<ProtectedRoute><AddClassPage /></ProtectedRoute>} />
      <Route path="/classes/:id" element={<ProtectedRoute><ClassDetailPage /></ProtectedRoute>} />
      
      {/* Teacher Routes */}

      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/employees/add" element={<AddEmployeePage />} />
      <Route path="/employees/:id" element={<EmployeeDetailPage />} />
      <Route path="/employees/:id/edit" element={<EditEmployeePage />} />

      {/* Exam Routes */}
      <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
      <Route path="/exams/add" element={<ProtectedRoute><CreateExamPage /></ProtectedRoute>} />
      <Route path="/exams/terms" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
      <Route path="/exams/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
      <Route path="/exams/:id" element={<ProtectedRoute><ExamDetailPage /></ProtectedRoute>} />
      <Route path="/exams/:examId/subjects/:subjectId/results" element={<ProtectedRoute><ResultsEntryPage /></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
      
      {/* Fee Routes */}
      <Route path="/fees" element={<ProtectedRoute><FeesPage /></ProtectedRoute>} />
      <Route path="/fees/types" element={<ProtectedRoute><FeeTypesPage /></ProtectedRoute>} />
      <Route path="/fees/templates" element={<ProtectedRoute><FeeTemplatesPage /></ProtectedRoute>} />
      <Route path="/fees/assign" element={<ProtectedRoute><AssignFeesPage /></ProtectedRoute>} />
      <Route path="/fees/record" element={<ProtectedRoute><RecordPaymentPage /></ProtectedRoute>} />
      <Route path="/fees/receipts/:receiptNumber" element={<ProtectedRoute><ReceiptDetailPage /></ProtectedRoute>} />
      <Route path="/my-fees" element={<StudentFeesPage />} />
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Announcements */}
      <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
      <Route path="/announcements/add" element={<ProtectedRoute><AddAnnouncementPage /></ProtectedRoute>} />

      {/* Attendance */}
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      
      {/* Reports */}
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

      {/* Continuous Assessment */}
      <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />
      <Route path="/assessments/add" element={<ProtectedRoute><AddAssessmentPage /></ProtectedRoute>} />
      <Route path="/assessments/:id/scores" element={<ProtectedRoute><AssessmentScoresPage /></ProtectedRoute>} />

      {/* Report Cards */}
      <Route path="/report-cards" element={<ProtectedRoute><ReportCardsPage /></ProtectedRoute>} />
      <Route path="/report-cards/:studentId/:termId" element={<ProtectedRoute><ReportCardDetailPage /></ProtectedRoute>} />
      <Route path="/report-cards/class/:classId/:termId" element={<ProtectedRoute><ReportCardsPage /></ProtectedRoute>} />

      {/* Student Promotion */}
      <Route path="/promotion" element={<ProtectedRoute><PromotionPage /></ProtectedRoute>} />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}