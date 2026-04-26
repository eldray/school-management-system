export default function StatusBadge({ status = "active" }: { status?: string }) {
    return (
      <span className={`px-4 py-1 text-xs font-medium rounded-full ${
        status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
      }`}>
        {status.toUpperCase()}
      </span>
    );
  }