import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import AccessDenied from '@/components/AccessDenied';
import { MEDICAL_DOCUMENT_TYPES } from '@/lib/constants';
import StatusBadge from '@/components/ui/StatusBadge';

// Mock documents for current patient – in real app from API
const getMockDocuments = (patientId) => [
  { id: 'doc-1', type: 'blood_test', name: 'CBC Report', date: '2025-02-15', status: 'Available', patientId: 'patient-1' },
  { id: 'doc-2', type: 'xray', name: 'Chest X-Ray', date: '2025-02-10', status: 'Available', patientId: 'patient-1' },
  { id: 'doc-3', type: 'ct_scan', name: 'CT Head', date: '2025-01-20', status: 'Available', patientId: 'patient-1' },
  { id: 'doc-4', type: 'blood_test', name: 'Lipid Panel', date: '2025-03-01', status: 'Pending', patientId: 'patient-1' }
];

const getDocumentTypeLabel = (value) => MEDICAL_DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;

function getSoftCopyText(doc) {
  return `Medical Document - ${doc.name}\nType: ${getDocumentTypeLabel(doc.type)}\nDate: ${doc.date}\nPatient ID: ${doc.patientId}\n\nThis is a soft copy for your records.`;
}

function viewSoftCopy(doc) {
  const text = getSoftCopyText(doc);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function downloadSoftCopy(doc) {
  const text = getSoftCopyText(doc);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.name.replace(/\s+/g, '_')}_${doc.date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MedicalDocumentsPage() {
  const { user } = useAuth();
  const [docType, setDocType] = useState('');
  const [applied, setApplied] = useState(false);
  const [documents, setDocuments] = useState(() => getMockDocuments(user?.patientId));

  if (!user) return null;
  if (user.role !== 'patient') {
    return <AccessDenied message="Only patients can access medical documents." />;
  }

  const myDocs = documents.filter((d) => d.patientId === user.patientId || d.patientId === `Patient/${user.patientId}`);

  const handleApply = (e) => {
    e.preventDefault();
    if (!docType) return;
    setDocuments((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        type: docType,
        name: `${getDocumentTypeLabel(docType)} Request`,
        date: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        patientId: user.patientId
      }
    ]);
    setApplied(true);
    setDocType('');
    setTimeout(() => setApplied(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Medical Documents</h1>
      <p className="text-gray-600 mb-6">
        Apply for, view, and collect soft copies of your blood tests, X-rays, and CT scans.
      </p>

      {/* Apply for a document */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Apply for a report</h2>
        <form onSubmit={handleApply} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Document type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select (Blood Test, X-Ray, CT Scan, MRI)</option>
              {MEDICAL_DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!docType}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            Apply
          </button>
        </form>
        {applied && <p className="mt-3 text-green-600 text-sm">Application submitted. You will be notified when the report is ready.</p>}
      </div>

      {/* View and collect */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <h2 className="font-semibold text-gray-900 p-4 border-b border-gray-200">My documents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myDocs.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{doc.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getDocumentTypeLabel(doc.type)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc.date}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3">
                    {doc.status === 'Available' ? (
                      <span className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => viewSoftCopy(doc)}
                          className="text-purple-600 hover:underline text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadSoftCopy(doc)}
                          className="text-purple-600 hover:underline text-sm font-medium"
                        >
                          Download soft copy
                        </button>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {myDocs.length === 0 && (
          <p className="text-gray-500 text-center py-8">No documents yet. Apply for a blood test, X-ray, or CT scan above.</p>
        )}
      </div>
    </div>
  );
}
