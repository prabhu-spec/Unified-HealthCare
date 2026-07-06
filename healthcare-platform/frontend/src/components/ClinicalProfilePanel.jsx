import { useCallback, useEffect, useState } from 'react';
import { coreFetch } from '@/lib/coreApi';

const EMPTY_ALLERGY = { allergen: '', reaction: '', severity: 'moderate', category: 'drug' };
const EMPTY_PROBLEM = { description: '', code: '', onsetDate: '', notes: '', status: 'active' };

const inputClass = 'px-3 py-2 border border-gray-300 rounded-lg text-sm w-full';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

export default function ClinicalProfilePanel({ patientId, user, canEdit }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clinicalProfile, setClinicalProfile] = useState({});
  const [allergies, setAllergies] = useState([]);
  const [problems, setProblems] = useState([]);
  const [allergyForm, setAllergyForm] = useState(EMPTY_ALLERGY);
  const [problemForm, setProblemForm] = useState(EMPTY_PROBLEM);

  const load = useCallback(async () => {
    if (!user || !patientId) return;
    try {
      setLoading(true);
      setError('');
      const res = await coreFetch(`/api/core/patients/${encodeURIComponent(patientId)}/clinical-profile`, user);
      setClinicalProfile(res.data?.clinicalProfile || {});
      setAllergies(res.data?.allergies || []);
      setProblems(res.data?.problems || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clinical profile.');
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        weightKg: clinicalProfile.weightKg === '' ? null : Number(clinicalProfile.weightKg),
        heightCm: clinicalProfile.heightCm === '' ? null : Number(clinicalProfile.heightCm),
        bloodType: clinicalProfile.bloodType || null,
        chiefComplaint: clinicalProfile.chiefComplaint || null,
        pregnancyStatus: clinicalProfile.pregnancyStatus || null,
        eGFR: clinicalProfile.eGFR === '' ? null : Number(clinicalProfile.eGFR),
        creatinine: clinicalProfile.creatinine === '' ? null : Number(clinicalProfile.creatinine),
        smokingStatus: clinicalProfile.smokingStatus || null,
        alcoholUse: clinicalProfile.alcoholUse || null,
        codeStatus: clinicalProfile.codeStatus || null,
      };
      await coreFetch(`/api/core/patients/${encodeURIComponent(patientId)}/clinical-profile`, user, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setSuccess('Clinical profile saved. AI Assist will use this data.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = async (e) => {
    e.preventDefault();
    if (!allergyForm.allergen.trim()) return;
    try {
      setError('');
      await coreFetch(`/api/core/patients/${encodeURIComponent(patientId)}/allergies`, user, {
        method: 'POST',
        body: JSON.stringify(allergyForm),
      });
      setAllergyForm(EMPTY_ALLERGY);
      await load();
      setSuccess('Allergy added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add allergy.');
    }
  };

  const removeAllergy = async (allergyId) => {
    try {
      await coreFetch(
        `/api/core/patients/${encodeURIComponent(patientId)}/allergies/${encodeURIComponent(allergyId)}`,
        user,
        { method: 'DELETE' }
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove allergy.');
    }
  };

  const addProblem = async (e) => {
    e.preventDefault();
    if (!problemForm.description.trim()) return;
    try {
      setError('');
      await coreFetch(`/api/core/patients/${encodeURIComponent(patientId)}/problems`, user, {
        method: 'POST',
        body: JSON.stringify(problemForm),
      });
      setProblemForm(EMPTY_PROBLEM);
      await load();
      setSuccess('Problem added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add problem.');
    }
  };

  const removeProblem = async (problemId) => {
    try {
      await coreFetch(
        `/api/core/patients/${encodeURIComponent(patientId)}/problems/${encodeURIComponent(problemId)}`,
        user,
        { method: 'DELETE' }
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove problem.');
    }
  };

  const setField = (key, value) => {
    setClinicalProfile((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <p className="text-gray-600 text-sm">Loading clinical profile…</p>;

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-violet-200 max-w-2xl mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Clinical Profile</h2>
        <p className="text-sm text-gray-600">
          Phase LLM-3 — data fed to AI Assist summaries and chat.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {success && <p className="text-emerald-700 text-sm mb-3">{success}</p>}

      <form onSubmit={saveProfile} className="space-y-4 mb-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input type="number" step="0.1" disabled={!canEdit} value={clinicalProfile.weightKg ?? ''} onChange={(e) => setField('weightKg', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height (cm)</label>
            <input type="number" step="0.1" disabled={!canEdit} value={clinicalProfile.heightCm ?? ''} onChange={(e) => setField('heightCm', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Blood type</label>
            <input disabled={!canEdit} value={clinicalProfile.bloodType ?? ''} onChange={(e) => setField('bloodType', e.target.value)} className={inputClass} placeholder="A+" />
          </div>
          <div>
            <label className={labelClass}>Code status</label>
            <select disabled={!canEdit} value={clinicalProfile.codeStatus ?? ''} onChange={(e) => setField('codeStatus', e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="full_code">Full code</option>
              <option value="dnr">DNR</option>
              <option value="limited">Limited</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Chief complaint</label>
          <textarea disabled={!canEdit} value={clinicalProfile.chiefComplaint ?? ''} onChange={(e) => setField('chiefComplaint', e.target.value)} className={inputClass} rows={2} placeholder="Why is the patient here today?" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pregnancy status</label>
            <select disabled={!canEdit} value={clinicalProfile.pregnancyStatus ?? ''} onChange={(e) => setField('pregnancyStatus', e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="not_applicable">Not applicable</option>
              <option value="none">None</option>
              <option value="pregnant">Pregnant</option>
              <option value="breastfeeding">Breastfeeding</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Smoking</label>
            <select disabled={!canEdit} value={clinicalProfile.smokingStatus ?? ''} onChange={(e) => setField('smokingStatus', e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="current">Current</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Alcohol use</label>
            <select disabled={!canEdit} value={clinicalProfile.alcoholUse ?? ''} onChange={(e) => setField('alcoholUse', e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="none">None</option>
              <option value="occasional">Occasional</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>eGFR</label>
            <input type="number" step="0.1" disabled={!canEdit} value={clinicalProfile.eGFR ?? ''} onChange={(e) => setField('eGFR', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Creatinine</label>
            <input type="number" step="0.01" disabled={!canEdit} value={clinicalProfile.creatinine ?? ''} onChange={(e) => setField('creatinine', e.target.value)} className={inputClass} />
          </div>
        </div>

        {canEdit && (
          <button type="submit" disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save clinical profile'}
          </button>
        )}
      </form>

      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Allergies</h3>
        {allergies.length === 0 && <p className="text-sm text-gray-500 mb-3">No allergies documented.</p>}
        <ul className="space-y-2 mb-4">
          {allergies.map((a) => (
            <li key={a.id} className="flex justify-between items-start gap-2 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
              <span>
                <span className="font-medium text-red-900">{a.allergen}</span>
                <span className="text-red-700"> · {a.category} · {a.severity}</span>
                {a.reaction && <span className="text-red-600"> — {a.reaction}</span>}
              </span>
              {canEdit && (
                <button type="button" onClick={() => removeAllergy(a.id)} className="text-red-600 hover:underline text-xs shrink-0">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {canEdit && (
          <form onSubmit={addAllergy} className="grid sm:grid-cols-2 gap-2">
            <input required value={allergyForm.allergen} onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })} className={inputClass} placeholder="Allergen (e.g. Penicillin)" />
            <input value={allergyForm.reaction} onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })} className={inputClass} placeholder="Reaction" />
            <select value={allergyForm.category} onChange={(e) => setAllergyForm({ ...allergyForm, category: e.target.value })} className={inputClass}>
              <option value="drug">Drug</option>
              <option value="food">Food</option>
              <option value="environmental">Environmental</option>
            </select>
            <select value={allergyForm.severity} onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })} className={inputClass}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <button type="submit" className="sm:col-span-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              Add allergy
            </button>
          </form>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Active problems</h3>
        {problems.length === 0 && <p className="text-sm text-gray-500 mb-3">No active problems documented.</p>}
        <ul className="space-y-2 mb-4">
          {problems.filter((p) => p.status === 'active').map((p) => (
            <li key={p.id} className="flex justify-between items-start gap-2 text-sm bg-amber-50 border border-amber-100 rounded-lg p-3">
              <span>
                <span className="font-medium text-amber-900">{p.description}</span>
                {p.code && <span className="text-amber-700"> [{p.code}]</span>}
                {p.onsetDate && <span className="text-amber-600"> · since {p.onsetDate}</span>}
              </span>
              {canEdit && (
                <button type="button" onClick={() => removeProblem(p.id)} className="text-amber-700 hover:underline text-xs shrink-0">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {canEdit && (
          <form onSubmit={addProblem} className="grid sm:grid-cols-2 gap-2">
            <input required value={problemForm.description} onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })} className={`${inputClass} sm:col-span-2`} placeholder="Problem description (e.g. Essential hypertension)" />
            <input value={problemForm.code} onChange={(e) => setProblemForm({ ...problemForm, code: e.target.value })} className={inputClass} placeholder="ICD code (optional)" />
            <input type="date" value={problemForm.onsetDate} onChange={(e) => setProblemForm({ ...problemForm, onsetDate: e.target.value })} className={inputClass} />
            <input value={problemForm.notes} onChange={(e) => setProblemForm({ ...problemForm, notes: e.target.value })} className={`${inputClass} sm:col-span-2`} placeholder="Notes (optional)" />
            <button type="submit" className="sm:col-span-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
              Add problem
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
