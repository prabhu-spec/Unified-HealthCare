import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';

export default function PrescriptionUploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  if (!user) return null;
  if (!getPermissions(user.role).canUploadPrescription) {
    return <AccessDenied message="Access denied." />;
  }

  const handleUpload = (e) => {
    e.preventDefault();
    if (file) setResult('AI suggestion: Verify dosage with your doctor. Possible match: Amoxicillin 500mg.');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Prescription (AI)</h1>
      <p className="text-gray-600 mb-6">Upload a photo for AI-based suggestions.</p>
      <div className="max-w-md bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prescription image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-50 file:text-purple-700"
            />
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700">
            Get AI suggestions
          </button>
        </form>
        {result && <p className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">{result}</p>}
      </div>
    </div>
  );
}
