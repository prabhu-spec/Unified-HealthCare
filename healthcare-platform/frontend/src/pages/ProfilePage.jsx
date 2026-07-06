import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '@/lib/auth';
import { DOCTOR_SPECIALIZATIONS, BLOOD_TYPES, GENDER_OPTIONS } from '@/lib/constants';
import PasswordInput from '@/components/ui/PasswordInput';

function getAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    updateUser,
    deleteAccount,
    requestPasswordChangeOTP,
    changePassword,
    requestDeleteAccountOTP,
    confirmDeleteAccount,
  } = useAuth();
  const [specialization, setSpecialization] = useState(user?.specialization ?? '');
  const [bloodType, setBloodType] = useState(user?.bloodType ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [saved, setSaved] = useState(false);
  const [changePwStep, setChangePwStep] = useState('idle'); // idle | requested | form
  const [changePwOtp, setChangePwOtp] = useState('');
  const [changePwNew, setChangePwNew] = useState('');
  const [changePwConfirm, setChangePwConfirm] = useState('');
  const [changePwError, setChangePwError] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState('idle'); // idle | requested | form
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setSpecialization(user?.specialization ?? '');
    setBloodType(user?.bloodType ?? '');
    setGender(user?.gender ?? '');
  }, [user?.specialization, user?.bloodType, user?.gender]);

  if (!user) return null;

  const age = getAge(user.dateOfBirth);
  const showDonorFields = user.role === 'patient' || user.role === 'doctor';

  const handleSaveSpecialization = () => {
    updateUser({ specialization: specialization || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBloodType = () => {
    updateUser({ bloodType: bloodType || undefined, gender: gender || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRequestChangePwOtp = async () => {
    setChangePwError('');
    setChangePwLoading(true);
    const result = await requestPasswordChangeOTP(user.email);
    setChangePwLoading(false);
    if (result.success) setChangePwStep('form');
    else setChangePwError(result.error || 'Failed to send code.');
  };

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();
    setChangePwError('');
    if (changePwNew !== changePwConfirm) {
      setChangePwError('Passwords do not match.');
      return;
    }
    if (changePwNew.length < 6) {
      setChangePwError('Password must be at least 6 characters.');
      return;
    }
    setChangePwLoading(true);
    const result = await changePassword(user.email, changePwOtp.trim(), changePwNew);
    setChangePwLoading(false);
    if (result.success) {
      setChangePwStep('idle');
      setChangePwOtp('');
      setChangePwNew('');
      setChangePwConfirm('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else setChangePwError(result.error || 'Failed to update password.');
  };

  const handleRequestDeleteOtp = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    const result = await requestDeleteAccountOTP(user.email);
    setDeleteLoading(false);
    if (result.success) setDeleteStep('form');
    else setDeleteError(result.error || 'Failed to send code.');
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);
    const result = await confirmDeleteAccount(user.email, deleteOtp.trim());
    setDeleteLoading(false);
    if (result.success) {
      deleteAccount();
      navigate('/register', { replace: true });
    } else setDeleteError(result.error || 'Invalid or expired code.');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <div className="space-y-3">
          <p><span className="font-medium text-gray-700">Name:</span> {user.firstName} {user.lastName}</p>
          <p><span className="font-medium text-gray-700">Email:</span> {user.email}</p>
          <p><span className="font-medium text-gray-700">Role:</span> {ROLE_LABELS[user.role]}</p>
          {user.dateOfBirth && (
            <p><span className="font-medium text-gray-700">Date of birth:</span> {user.dateOfBirth}</p>
          )}
          {age != null && (
            <p><span className="font-medium text-gray-700">Age:</span> {age}</p>
          )}
          {(user.gender || showDonorFields) && (
            <p><span className="font-medium text-gray-700">Gender:</span> {user.gender ? GENDER_OPTIONS.find((g) => g.value === user.gender)?.label ?? user.gender : '—'}</p>
          )}
          {(user.bloodType || showDonorFields) && (
            <p><span className="font-medium text-gray-700">Blood type:</span> {user.bloodType || '—'}</p>
          )}
          {user.hospitalId && (
            <p><span className="font-medium text-gray-700">Hospital ID:</span> {user.hospitalId}</p>
          )}
        </div>

        {showDonorFields && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Donor info (for blood bank matching)</h3>
            <p className="text-xs text-gray-500 mb-3">Name, age, gender, DOB and blood type help the blood bank contact you when needed.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood type</label>
                <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select</option>
                  {BLOOD_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleSaveBloodType} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                Save donor info
              </button>
              {saved && <span className="ml-2 text-green-600 text-sm">Saved.</span>}
            </div>
          </div>
        )}

        {user.role === 'doctor' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">My specialization</label>
            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select specialization</option>
              {DOCTOR_SPECIALIZATIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button type="button" onClick={handleSaveSpecialization} className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
              Save specialization
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Change password</h3>
          <p className="text-xs text-gray-500 mb-3">We’ll send a verification code to your email before updating your password.</p>
          {changePwStep === 'idle' && (
            <button
              type="button"
              onClick={handleRequestChangePwOtp}
              disabled={changePwLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {changePwLoading ? 'Sending code...' : 'Send verification code'}
            </button>
          )}
          {changePwStep === 'form' && (
            <form onSubmit={handleSubmitChangePassword} className="space-y-3 mt-2">
              {changePwError && <p className="text-red-600 text-sm">{changePwError}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification code (from email)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={changePwOtp}
                  onChange={(e) => setChangePwOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New password</label>
                <PasswordInput
                  value={changePwNew}
                  onChange={(e) => setChangePwNew(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm password</label>
                <PasswordInput
                  value={changePwConfirm}
                  onChange={(e) => setChangePwConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={changePwLoading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {changePwLoading ? 'Updating...' : 'Update password'}
                </button>
                <button type="button" onClick={() => { setChangePwStep('idle'); setChangePwError(''); setChangePwOtp(''); setChangePwNew(''); setChangePwConfirm(''); }} className="text-gray-600 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
          {saved && changePwStep === 'idle' && <p className="mt-2 text-green-600 text-sm">Password updated.</p>}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Delete account</h3>
          <p className="text-xs text-gray-500 mb-3">Permanently delete your account. We’ll send a verification code to your email. This cannot be undone.</p>
          {deleteStep === 'idle' && (
            <button
              type="button"
              onClick={handleRequestDeleteOtp}
              disabled={deleteLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleteLoading ? 'Sending code...' : 'Request deletion code'}
            </button>
          )}
          {deleteStep === 'form' && (
            <form onSubmit={handleConfirmDelete} className="space-y-3 mt-2">
              {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification code (from email)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={deleteLoading} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {deleteLoading ? 'Deleting...' : 'Permanently delete my account'}
                </button>
                <button type="button" onClick={() => { setDeleteStep('idle'); setDeleteError(''); setDeleteOtp(''); }} className="text-gray-600 text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
