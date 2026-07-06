import { Link } from 'react-router-dom';

export default function AccessDenied({ message = "You don't have permission to view this." }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center max-w-md mx-auto">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold text-amber-900 mb-2">Access Denied</h2>
      <p className="text-amber-800 mb-6">{message}</p>
      <Link to="/" className="text-purple-600 hover:underline font-medium">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
