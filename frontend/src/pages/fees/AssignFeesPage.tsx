import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Users, Layers, CheckCircle, AlertCircle, Eye, Copy } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useFeeTemplates, useAssignTemplateToClass, useClassTemplateAssignments } from '../../hooks/useFees';
import { useTerms } from '../../hooks/useExams';
import { useClasses } from '../../hooks/useClasses';

export default function AssignFeesPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [assignToAllClasses, setAssignToAllClasses] = useState(false);

  const { data: templates = [] } = useFeeTemplates();
  const { data: terms = [] } = useTerms();
  const { data: classes = [] } = useClasses();
  const { data: existingAssignments = [] } = useClassTemplateAssignments(selectedTerm);
  const assignTemplate = useAssignTemplateToClass();

  // Set default term to next term or active term
  useEffect(() => {
    const nextTerm = terms.find(t => new Date(t.startDate) > new Date());
    const activeTerm = terms.find(t => t.isActive);
    if (nextTerm && !selectedTerm) {
      setSelectedTerm(nextTerm.id);
    } else if (activeTerm && !selectedTerm) {
      setSelectedTerm(activeTerm.id);
    }
  }, [terms]);

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const classesWithAssignments = existingAssignments?.map((a: any) => a.classId) || [];
  
  const availableClasses = assignToAllClasses 
    ? classes 
    : classes.filter(c => !classesWithAssignments.includes(c.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) {
      alert('Please select a fee template');
      return;
    }
    if (!selectedTerm) {
      alert('Please select a term');
      return;
    }
    
    const targetClasses = assignToAllClasses ? classes.map(c => c.id) : [selectedClass];
    
    if (targetClasses.length === 0) {
      alert('No classes selected for assignment');
      return;
    }
    
    const totalStudents = targetClasses.reduce((sum, classId) => {
      const cls = classes.find(c => c.id === classId);
      return sum + (cls?.studentCount || 0);
    }, 0);
    
    const templateTotal = selectedTemplateData?.items.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
    
    const confirmMessage = `⚠️ CONFIRM FEE ASSIGNMENT\n\n` +
      `Template: ${selectedTemplateData?.name}\n` +
      `Term: ${terms.find(t => t.id === selectedTerm)?.name}\n` +
      `Classes: ${targetClasses.length} class(es)\n` +
      `Students affected: ${totalStudents}\n` +
      `Fees per student: ₵${templateTotal.toLocaleString()}\n` +
      `Total fees to be collected: ₵${(templateTotal * totalStudents).toLocaleString()}\n\n` +
      `This will assign these fees to ALL students in the selected classes.\n\n` +
      `Proceed?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const results = [];
      for (const classId of targetClasses) {
        const result = await assignTemplate.mutateAsync({
          templateId: selectedTemplate,
          classId,
          termId: selectedTerm,
        });
        results.push(result);
      }
      
      alert(`✅ Fees assigned successfully!\n\n` +
        `Template: ${selectedTemplateData?.name}\n` +
        `Classes: ${targetClasses.length}\n` +
        `Students: ${totalStudents}\n\n` +
        `Students will automatically see these fees in their portal.`);
      
      navigate('/fees');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign fees');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₵${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1a3d30]";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <DashboardLayout title="Assign Fees">
      <button onClick={() => navigate('/fees')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Fees
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#1a3d30]/10 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#1a3d30]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Fee Template to Classes</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Select a template and assign it to one or more classes for a specific term
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className={labelCls}>Select Fee Template *</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">-- Select a template --</option>
              {templates.map((template: any) => {
                const total = template.items.reduce((sum: number, item: any) => sum + item.amount, 0);
                return (
                  <option key={template.id} value={template.id}>
                    {template.name} - Total: {formatCurrency(total)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Template Preview */}
          {selectedTemplateData && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-gray-800">Template Preview</h4>
              </div>
              <div className="space-y-2">
                {selectedTemplateData.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {item.isOptional && <span className="text-xs text-gray-400">(Optional)</span>}
                      <span className="text-gray-600">{item.feeType?.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total per student</span>
                    <span className="text-[#1a3d30]">
                      {formatCurrency(selectedTemplateData.items.reduce((sum: number, item: any) => sum + item.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Term Selection */}
          <div>
            <label className={labelCls}>Academic Term *</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">-- Select term --</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} ({term.academicYear}) {term.isActive && '✨ Active'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Fees will be applied for this term only
            </p>
          </div>

          {/* Assignment Type */}
          <div>
            <label className={labelCls}>Assignment Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAssignToAllClasses(false)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${
                  !assignToAllClasses
                    ? 'bg-[#1a3d30] text-white border-[#1a3d30]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                Single Class
              </button>
              <button
                type="button"
                onClick={() => setAssignToAllClasses(true)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${
                  assignToAllClasses
                    ? 'bg-[#1a3d30] text-white border-[#1a3d30]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Copy className="w-4 h-4" />
                All Classes
              </button>
            </div>
          </div>

          {/* Class Selection */}
          {!assignToAllClasses ? (
            <div>
              <label className={labelCls}>Select Class *</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">-- Select a class --</option>
                {availableClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - Grade {cls.gradeLevel} ({cls.studentCount} students)
                    {classesWithAssignments.includes(cls.id) && ' (Already has fees for this term)'}
                  </option>
                ))}
              </select>
              {selectedClass && classesWithAssignments.includes(selectedClass) && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  This class already has fees assigned for this term. Assigning again will update/replace them.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Classes to be assigned:</span>
                <span className="text-sm font-bold text-[#1a3d30]">{classes.length} classes</span>
              </div>
              <div className="text-sm text-gray-500">
                Total students: {classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {classes.slice(0, 5).map(cls => (
                  <span key={cls.id} className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{cls.name}</span>
                ))}
                {classes.length > 5 && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">+{classes.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedTemplateData && (selectedClass || assignToAllClasses) && selectedTerm && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
              <h4 className="font-semibold text-gray-800 mb-3">Assignment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium">{selectedTemplateData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">{terms.find(t => t.id === selectedTerm)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Classes:</span>
                  <span className="font-medium">
                    {assignToAllClasses ? `All ${classes.length} classes` : classes.find(c => c.id === selectedClass)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Students affected:</span>
                  <span className="font-medium">
                    {assignToAllClasses 
                      ? classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)
                      : classes.find(c => c.id === selectedClass)?.studentCount || 0}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total per student:</span>
                    <span className="text-[#1a3d30]">
                      {formatCurrency(selectedTemplateData.items.reduce((sum: number, item: any) => sum + item.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Total for all students:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(
                        (assignToAllClasses 
                          ? classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)
                          : classes.find(c => c.id === selectedClass)?.studentCount || 0) *
                        selectedTemplateData.items.reduce((sum: number, item: any) => sum + item.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-billing Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Auto-billing Enabled</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  When a new student is added to a class that has this fee template assigned, 
                  they will automatically be billed for all fees in the template.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/fees')}
              className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignTemplate.isPending || !selectedTemplate || !selectedTerm || (!assignToAllClasses && !selectedClass)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a3d30] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#153328] disabled:opacity-50"
            >
              {assignTemplate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Assign Fees to {assignToAllClasses ? 'All Classes' : 'Class'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}