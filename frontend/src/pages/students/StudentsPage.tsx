import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, SlidersHorizontal, ChevronDown, Loader2, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StudentTable from '../../components/students/StudentTable';
import api from '../../lib/api';
import { Student } from '../../types';
import { Class } from '../../types/class';
import { useAuth } from '../../context/AuthContext';
import { useTeacherAccessibleClasses } from '../../hooks/useAttendance';

export default function StudentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  // Get teacher accessible classes to know which classes they can see
  const { data: teacherClassesData, isLoading: teacherClassesLoading } = useTeacherAccessibleClasses();
  
  const { data: allStudents = [], isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get('/students');
      return res.data.data;
    },
  });

  const { data: allClasses = [], isLoading: loadingClasses } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/classes');
      return res.data.data;
    },
  });

  // Filter classes based on teacher permissions
  let visibleClasses: any[] = [];
  let canAddStudents = false;

  if (isAdmin) {
    visibleClasses = allClasses;
    canAddStudents = true;
  } else if (isTeacher && teacherClassesData) {
    // Teachers can see classes where they are Class Teacher or Subject Teacher
    visibleClasses = teacherClassesData.filter((c: any) => c.canViewStudents === true);
    // Teachers can add students ONLY to classes where they are Class Teacher
    canAddStudents = teacherClassesData.some((c: any) => c.accessType === 'CLASS_TEACHER');
  }

  const visibleClassIds = visibleClasses.map((c: any) => c.id);

  // Filter students based on teacher permissions
  let filteredStudents = allStudents;
  
  if (isTeacher) {
    // Teachers can only see students in classes they have access to
    filteredStudents = allStudents.filter(s => visibleClassIds.includes(s.class?.id));
  }

  // Apply search and status filters
  filteredStudents = filteredStudents.filter(s => {
    const matchesSearch = 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesClass = classFilter === 'ALL' || s.class?.id === classFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeStudents = filteredStudents.filter(s => s.status === 'ACTIVE').length;
  const unassignedStudents = filteredStudents.filter(s => !s.class).length;

  // Check if teacher is unassigned (can't view any students)
  const isUnassignedTeacher = isTeacher && teacherClassesData && teacherClassesData.length > 0 && 
    teacherClassesData.every((c: any) => c.canViewStudents === false);

  if (isTeacher && teacherClassesLoading) {
    return (
      <DashboardLayout title="Students">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show unassigned teacher message
  if (isUnassignedTeacher) {
    return (
      <DashboardLayout title="Students">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Student Access</h3>
          <p className="text-yellow-700 mb-4">
            You are not assigned to any class as a Class Teacher or Subject Teacher.
          </p>
          <p className="text-yellow-600 text-sm">
            Once assigned to a class, you'll be able to view student records for that class.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Students">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Students</h2>
            <p className="text-gray-500 text-sm mt-0.5">Manage student records, admissions, and details</p>
          </div>
          {canAddStudents && (
            <button
              onClick={() => navigate('/students/add')}
              className="flex items-center gap-2 bg-[#1a3d30] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#153328] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Visible Students</p>
            <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Active Students</p>
            <p className="text-2xl font-bold text-green-600">{activeStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Unassigned</p>
            <p className="text-2xl font-bold text-amber-600">{unassignedStudents}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3d30]"
              />
            </div>
            
            {/* Class Filter - Only show classes teacher has access to */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowClassDropdown(!showClassDropdown);
                  setShowStatusDropdown(false);
                }}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {classFilter === 'ALL' ? 'All Classes' : visibleClasses.find(c => c.id === classFilter)?.name || 'Class'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showClassDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[200px] max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setClassFilter('ALL');
                      setShowClassDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${classFilter === 'ALL' ? 'bg-gray-50 text-[#1a3d30] font-medium' : 'text-gray-700'}`}
                  >
                    All Classes
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  {loadingClasses ? (
                    <div className="px-4 py-2 text-sm text-gray-400">Loading...</div>
                  ) : (
                    visibleClasses.map(cls => (
                      <button
                        key={cls.id}
                        onClick={() => {
                          setClassFilter(cls.id);
                          setShowClassDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${classFilter === cls.id ? 'bg-gray-50 text-[#1a3d30] font-medium' : 'text-gray-700'}`}
                      >
                        {cls.name} 
                        {cls.accessType === 'SUBJECT_TEACHER' && ' (Subject)'}
                        {cls.accessType === 'CLASS_TEACHER' && ' (Class Teacher)'}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowClassDropdown(false);
                }}
                className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                {statusFilter === 'ALL' ? 'All Status' : statusFilter}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                  {['ALL', 'ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${statusFilter === status ? 'bg-gray-50 text-[#1a3d30] font-medium' : 'text-gray-700'}`}
                    >
                      {status === 'ALL' ? 'All Status' : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(classFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setClassFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#1a3d30]" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No students found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <StudentTable
              students={filteredStudents}
              onView={(id) => navigate(`/students/${id}`)}
            />
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showClassDropdown || showStatusDropdown) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowClassDropdown(false);
            setShowStatusDropdown(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}