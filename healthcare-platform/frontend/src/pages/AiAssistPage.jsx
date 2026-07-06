import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { canUseAiAssist, canAcceptAiDraft } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';
import { aiChat, fetchAiStatus, summarizePatient, acceptAiDraft } from '@/lib/aiApi';
import { getPatientName } from '@/lib/utils';

function formatAiText(text) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return (
        <p key={i} className="font-semibold text-gray-900 mt-2">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    }
    if (trimmed.startsWith('- ')) {
      return (
        <li key={i} className="ml-4 text-gray-800 list-disc">
          {trimmed.slice(2)}
        </li>
      );
    }
    if (trimmed.startsWith('_') && trimmed.endsWith('_')) {
      return (
        <p key={i} className="text-sm text-gray-500 italic mt-2">
          {trimmed.replace(/_/g, '')}
        </p>
      );
    }
    return (
      <p key={i} className="text-gray-800">
        {line}
      </p>
    );
  });
}

export default function AiAssistPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId') || '';

  const [status, setStatus] = useState(null);
  const [patientLabel, setPatientLabel] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryMeta, setSummaryMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [appendToNotes, setAppendToNotes] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchAiStatus()
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!user || !patientIdParam) return;
    coreFetch(`/api/core/patients/${encodeURIComponent(patientIdParam)}`, user)
      .then((res) => {
        const p = res.data?.patient;
        if (p) setPatientLabel(getPatientName(p));
      })
      .catch(() => setPatientLabel(`Patient ${patientIdParam}`));
  }, [user, patientIdParam]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingChat]);

  const runSummary = async () => {
    if (!patientIdParam) {
      setError('Add ?patientId=... to the URL or open AI Summary from a patient record.');
      return;
    }
    setLoadingSummary(true);
    setError('');
    try {
      const res = await summarizePatient(patientIdParam);
      setSummary(res.data.summary);
      setDraftText(res.data.summary);
      setSummaryMeta(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Summary failed.');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (patientIdParam && user && canUseAiAssist(user.role)) {
      runSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientIdParam, user?.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loadingChat) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoadingChat(true);
    setError('');

    try {
      const res = await aiChat(text, patientIdParam || undefined);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.data.reply, meta: res.data },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed.');
    } finally {
      setLoadingChat(false);
    }
  };

  const saveDraftToNotes = async (source = 'summary', textOverride) => {
    const text = (textOverride ?? draftText).trim();
    if (!patientIdParam || !text) return;
    setSavingDraft(true);
    setError('');
    setSaveSuccess('');
    try {
      await acceptAiDraft(patientIdParam, { draft: text, source, append: appendToNotes });
      setSaveSuccess('Draft saved to patient consult notes. A clinician should review the chart.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const acceptChatReply = async (text) => {
    setDraftText(text);
    await saveDraftToNotes('chat', text);
  };

  if (!user) return null;
  const canSaveDraft = canAcceptAiDraft(user.role);
  if (!canUseAiAssist(user.role)) {
    return <AccessDenied message="AI Assist is not available for your role." />;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Assist</h1>
        <p className="text-gray-600 mt-1">
          Clinical documentation helper — separate LLM service, does not modify your dashboard data.
        </p>
        {status && (
          <p className="text-sm text-gray-500 mt-2">
            Provider: <span className="font-medium">{status.mode}</span> · model: {status.model}
            {status.mode === 'mock' && ' (configure OPENAI_API_KEY or Ollama in llm-service/.env)'}
          </p>
        )}
        {summaryMeta?.contextSources?.length > 0 && (
          <p className="text-xs text-emerald-700 mt-2">
            Context loaded: {summaryMeta.contextSources.join(', ')} (Phase LLM-2)
          </p>
        )}
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">{saveSuccess}</div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {patientIdParam ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
              <p className="text-sm text-gray-600">
                {patientLabel || 'Loading patient…'} ·{' '}
                <Link to={`/patients/${patientIdParam}`} className="text-sky-600 hover:underline">
                  View patient record
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={runSummary}
              disabled={loadingSummary}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              {loadingSummary ? 'Summarizing…' : 'Refresh summary'}
            </button>
          </div>

          {loadingSummary && !summary && <p className="text-gray-600 text-sm">Generating summary…</p>}

          {summary && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none bg-violet-50 border border-violet-100 rounded-lg p-4">
                {formatAiText(summary)}
                {summaryMeta?.disclaimer && (
                  <p className="text-xs text-amber-800 mt-4 border-t border-violet-200 pt-3">{summaryMeta.disclaimer}</p>
                )}
              </div>

              {canSaveDraft && patientIdParam && (
                <div className="border border-violet-200 rounded-lg p-4 bg-white">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Review &amp; accept draft (Phase LLM-5)</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Edit the summary below, then save to the patient&apos;s consult notes after clinical review.
                  </p>
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono min-h-[140px]"
                    rows={6}
                  />
                  <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={appendToNotes}
                      onChange={(e) => setAppendToNotes(e.target.checked)}
                    />
                    Append to existing notes (uncheck to replace)
                  </label>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      disabled={savingDraft || !draftText.trim()}
                      onClick={() => saveDraftToNotes('summary')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingDraft ? 'Saving…' : 'Accept & save to notes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftText(summary)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Reset to AI text
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
          <p className="font-medium text-gray-900 mb-1">No patient selected</p>
          <p>
            Open <strong>AI Summary</strong> from a patient record, or go to{' '}
            <Link to="/patients" className="text-sky-600 hover:underline">
              Patient Details
            </Link>{' '}
            and pick a patient.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col min-h-[420px]">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          <p className="text-sm text-gray-600">
            {patientIdParam
              ? 'Questions use this patient’s records as context.'
              : 'General platform questions (no patient context).'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[360px]">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">
              Try: &quot;Summarize active concerns&quot; or &quot;Explain recent records in plain language&quot;
            </p>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-3 text-sm ${
                msg.role === 'user' ? 'bg-sky-50 ml-8' : 'bg-gray-50 mr-8 border border-gray-100'
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 mb-1">{msg.role === 'user' ? 'You' : 'AI Assist'}</p>
              {msg.role === 'assistant' ? formatAiText(msg.text) : <p className="text-gray-800">{msg.text}</p>}
              {msg.role === 'assistant' && canSaveDraft && patientIdParam && (
                <button
                  type="button"
                  onClick={() => acceptChatReply(msg.text)}
                  disabled={savingDraft}
                  className="mt-2 text-xs text-emerald-700 hover:underline disabled:opacity-50"
                >
                  Accept this reply to notes
                </button>
              )}
            </div>
          ))}
          {loadingChat && <p className="text-sm text-gray-500">Thinking…</p>}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this patient or the platform…"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            disabled={loadingChat}
          />
          <button
            type="submit"
            disabled={loadingChat || !input.trim()}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
