import { CLINICAL_SYSTEM_PROMPT, PATIENT_FRIENDLY_PROMPT } from "./prompts.js";

export type LlmMode = "openai" | "ollama" | "mock";

export interface LlmResult {
  text: string;
  mode: LlmMode;
  model: string;
  disclaimer: string;
}

const DISCLAIMER =
  "AI-generated draft — verify before clinical use. Not a substitute for professional medical judgment.";

function detectMode(): LlmMode {
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.OLLAMA_BASE_URL?.trim()) return "ollama";
  return "mock";
}

function mockSummaryFromContext(context: unknown): string {
  const data = context as {
    demographics?: { age?: number; gender?: string; bmi?: number; bloodType?: string };
    visit?: { status?: string; room?: string; chiefComplaint?: string };
    allergies?: { allergen?: string; severity?: string }[];
    activeProblems?: { description?: string; code?: string }[];
    medications?: { medication?: string; dosage?: string }[];
    labsAndRecords?: { name?: string; value?: string }[];
    vitals?: { latest?: { heartRate?: number; systolic?: number; diastolic?: number; spo2?: number } | null };
    clinicalNotes?: { consultNotes?: string };
    meta?: { sources?: string[] };
  };

  const demo = data?.demographics;
  const visit = data?.visit;
  const allergies = data?.allergies || [];
  const problems = data?.activeProblems || [];
  const meds = data?.medications || [];
  const records = data?.labsAndRecords || [];
  const vitals = data?.vitals?.latest;

  const lines = [
    `**Pre-visit summary (demo mode — structured context loaded)**`,
    ``,
    `- Patient: ${demo?.gender || "unknown"}, age ${demo?.age ?? "?"}, BMI ${demo?.bmi ?? "?"}, blood type ${demo?.bloodType || "?"}`,
    `- Visit: ${visit?.status || "unknown"}${visit?.room ? `, room ${visit.room}` : ""}`,
    `- Chief complaint: ${visit?.chiefComplaint || "Not documented"}`,
    `- Allergies: ${allergies.length ? allergies.map((a) => `${a.allergen} (${a.severity})`).join("; ") : "None documented"}`,
    `- Active problems: ${problems.length ? problems.map((p) => `${p.description}${p.code ? ` [${p.code}]` : ""}`).join("; ") : "None documented"}`,
    `- Active medications: ${meds.length ? meds.map((m) => `${m.medication} — ${m.dosage}`).join("; ") : "None documented"}`,
    `- Recent labs/records: ${records.length ? records.slice(0, 3).map((r) => `${r.name}: ${r.value}`).join("; ") : "None"}`,
    `- Latest vitals: ${vitals ? `HR ${vitals.heartRate}, BP ${vitals.systolic}/${vitals.diastolic}, SpO2 ${vitals.spo2}%` : "Not available"}`,
    `- Notes: ${data?.clinicalNotes?.consultNotes || "None"}`,
    `- Context sources: ${(data?.meta?.sources || []).join(", ") || "patient"}`,
    ``,
    `_Configure OPENAI_API_KEY or Ollama for live LLM responses._`,
  ];
  return lines.join("\n");
}

function mockChatReply(message: string, hasPatientContext: boolean): string {
  return [
    `**Demo mode** — LLM provider not configured.`,
    ``,
    hasPatientContext
      ? `I received your question with patient context attached. In production, an LLM would answer using only that data.`
      : `I received your message: "${message.slice(0, 200)}${message.length > 200 ? "…" : ""}"`,
    ``,
    `Add \`OPENAI_API_KEY\` or run Ollama locally and set \`OLLAMA_BASE_URL\` in \`llm-service/.env\`.`,
  ].join("\n");
}

async function callOpenAi(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${err.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() || "No response from model.";
}

async function callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
  const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error (${res.status}): ${err.slice(0, 300)}`);
  }

  const json = (await res.json()) as { message?: { content?: string } };
  return json.message?.content?.trim() || "No response from Ollama.";
}

export async function generateSummary(patientContext: unknown): Promise<LlmResult> {
  const mode = detectMode();
  const model =
    mode === "openai"
      ? process.env.OPENAI_MODEL || "gpt-4o-mini"
      : mode === "ollama"
        ? process.env.OLLAMA_MODEL || "llama3.2"
        : "mock";

  if (mode === "mock") {
    return { text: mockSummaryFromContext(patientContext), mode, model, disclaimer: DISCLAIMER };
  }

  const userPrompt = `Structured patient context (JSON):
${JSON.stringify(patientContext, null, 2)}

Provide a concise pre-visit chart summary with:
1. One-line headline
2. Allergies and safety flags (highlight first)
3. Active problems and medications
4. Latest vitals and key labs
5. Suggested clinician follow-up questions
Only use data present in the JSON.`;
  const text =
    mode === "openai"
      ? await callOpenAi(CLINICAL_SYSTEM_PROMPT, userPrompt)
      : await callOllama(CLINICAL_SYSTEM_PROMPT, userPrompt);

  return { text, mode, model, disclaimer: DISCLAIMER };
}

export async function generateChat(
  message: string,
  patientContext: unknown | null,
  role: string | undefined
): Promise<LlmResult> {
  const mode = detectMode();
  const model =
    mode === "openai"
      ? process.env.OPENAI_MODEL || "gpt-4o-mini"
      : mode === "ollama"
        ? process.env.OLLAMA_MODEL || "llama3.2"
        : "mock";

  const isPatient = role?.toLowerCase() === "patient";
  const systemPrompt = isPatient ? PATIENT_FRIENDLY_PROMPT : CLINICAL_SYSTEM_PROMPT;

  if (mode === "mock") {
    return {
      text: mockChatReply(message, !!patientContext),
      mode,
      model,
      disclaimer: DISCLAIMER,
    };
  }

  const userPrompt = patientContext
    ? `Context:\n${JSON.stringify(patientContext, null, 2)}\n\nQuestion: ${message}`
    : message;

  const text =
    mode === "openai"
      ? await callOpenAi(systemPrompt, userPrompt)
      : await callOllama(systemPrompt, userPrompt);

  return { text, mode, model, disclaimer: DISCLAIMER };
}

export function getLlmStatus() {
  const mode = detectMode();
  return {
    enabled: process.env.AI_ENABLED !== "false",
    mode,
    model:
      mode === "openai"
        ? process.env.OPENAI_MODEL || "gpt-4o-mini"
        : mode === "ollama"
          ? process.env.OLLAMA_MODEL || "llama3.2"
          : "mock",
  };
}
