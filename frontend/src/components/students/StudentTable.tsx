import { Student } from '../../types';
import StatusBadge from '../ui/StatusBadge';

interface Props {
  students: Student[];
  onView: (id: string) => void;
}

export default function StudentTable({ students, onView }: Props) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left py-4 px-6 font-medium text-gray-600">Student</th>
            <th className="text-left py-4 px-6 font-medium text-gray-600">Admission No</th>
            <th className="text-left py-4 px-6 font-medium text-gray-600">Class</th>
            <th className="text-left py-4 px-6 font-medium text-gray-600">Guardian</th>
            <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
            <th className="w-16"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-b hover:bg-gray-50">
              <td className="py-5 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-700 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {getInitials(s.firstName, s.lastName)}
                  </div>
                  <div>
                    <p className="font-medium">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">
                      {s.gender?.toLowerCase() || 'N/A'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-5 px-6">
                <span className="font-mono text-sm">{s.admissionNumber}</span>
              </td>
              <td className="py-5 px-6">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {s.class?.name || 'Not Assigned'}
                </span>
              </td>
              <td className="py-5 px-6">
                <p className="font-medium text-sm">{s.guardian?.name || '—'}</p>
                <p className="text-xs text-gray-500">{s.guardian?.phone || '—'}</p>
              </td>
              <td className="py-5 px-6">
                <StatusBadge status={s.status.toLowerCase()} />
              </td>
              <td className="py-5 px-6">
                <button 
                  onClick={() => onView(s.id)} 
                  className="text-emerald-700 hover:text-emerald-800 font-medium text-lg"
                >
                  ···
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}