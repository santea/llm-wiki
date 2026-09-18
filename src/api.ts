import { NoteItem, ClassificationRule, TriageCardData, AgentPrompt, AgentType } from './types';

export async function fetchNotesFromApi(): Promise<NoteItem[]> {
  const res = await fetch('/api/notes');
  if (!res.ok) {
    throw new Error(`Failed to fetch notes: ${res.statusText}`);
  }
  const data = await res.json();
  return data.notes || [];
}

export async function createNoteInApi(note: Partial<NoteItem>): Promise<NoteItem> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  });
  if (!res.ok) {
    throw new Error(`Failed to create note: ${res.statusText}`);
  }
  const data = await res.json();
  return data.note;
}

export async function updateNoteInApi(note: NoteItem): Promise<NoteItem> {
  const res = await fetch(`/api/notes/${encodeURIComponent(note.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  });
  if (!res.ok) {
    throw new Error(`Failed to update note: ${res.statusText}`);
  }
  const data = await res.json();
  return data.note;
}

export async function deleteNoteFromApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Failed to delete note: ${res.statusText}`);
  }
  const data = await res.json();
  return Boolean(data.success);
}

export const deleteNoteInApi = deleteNoteFromApi;

export async function fetchStatsFromApi() {
  const res = await fetch('/api/stats');
  if (!res.ok) return null;
  const data = await res.json();
  return data.stats;
}

export async function analyzeRefineryRaw(rawContent: string, sourceHint?: string) {
  const res = await fetch('/api/refinery/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawContent, sourceHint })
  });
  if (!res.ok) {
    throw new Error(`Failed to analyze raw content: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

export async function testRulesInSandbox(text: string) {
  const res = await fetch('/api/rules/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    throw new Error(`Failed to test rules: ${res.statusText}`);
  }
  return await res.json();
}

export async function generateAiDiff(docId: string, currentContent: string, userRequest: string, docTitle?: string) {
  const res = await fetch('/api/ai/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docId, currentContent, userRequest, docTitle })
  });
  if (!res.ok) {
    throw new Error(`Failed to generate AI diff: ${res.statusText}`);
  }
  const data = await res.json();
  return data.diffProposal;
}

export async function importMarkdownFiles(files: Array<{ filename: string; content: string }>) {
  const res = await fetch('/api/vault/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  });
  if (!res.ok) {
    throw new Error(`Failed to import files: ${res.statusText}`);
  }
  const data = await res.json();
  return data.notes as NoteItem[];
}

// Classification Rules API
export async function fetchRulesFromApi(): Promise<ClassificationRule[]> {
  const res = await fetch('/api/rules');
  if (!res.ok) throw new Error(`Failed to fetch rules: ${res.statusText}`);
  const data = await res.json();
  return data.rules || [];
}

export async function createRuleInApi(rule: Partial<ClassificationRule>): Promise<ClassificationRule> {
  const res = await fetch('/api/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  if (!res.ok) throw new Error(`Failed to create rule: ${res.statusText}`);
  const data = await res.json();
  return data.rule;
}

export async function toggleRuleInApi(id: string): Promise<ClassificationRule> {
  const res = await fetch(`/api/rules/${encodeURIComponent(id)}/toggle`, {
    method: 'PUT'
  });
  if (!res.ok) throw new Error(`Failed to toggle rule: ${res.statusText}`);
  const data = await res.json();
  return data.rule;
}

export async function deleteRuleFromApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/rules/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete rule: ${res.statusText}`);
  const data = await res.json();
  return Boolean(data.success);
}

// Triage Cards API
export async function fetchTriageCardsFromApi(): Promise<TriageCardData[]> {
  const res = await fetch('/api/triage');
  if (!res.ok) throw new Error(`Failed to fetch triage cards: ${res.statusText}`);
  const data = await res.json();
  return data.cards || [];
}

export async function createTriageCardInApi(card: Partial<TriageCardData>): Promise<TriageCardData> {
  const res = await fetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
  });
  if (!res.ok) throw new Error(`Failed to create triage card: ${res.statusText}`);
  const data = await res.json();
  return data.card;
}

export async function deleteTriageCardFromApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/triage/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete triage card: ${res.statusText}`);
  const data = await res.json();
  return Boolean(data.success);
}

export async function clearAllTriageCardsFromApi(): Promise<boolean> {
  const res = await fetch('/api/triage', {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to clear triage cards: ${res.statusText}`);
  const data = await res.json();
  return Boolean(data.success);
}

// AI Agent Prompts Hub API
export async function fetchAgentPromptsFromApi(): Promise<AgentPrompt[]> {
  const res = await fetch('/api/agent-prompts');
  if (!res.ok) throw new Error(`Failed to fetch agent prompts: ${res.statusText}`);
  const data = await res.json();
  return data.prompts || [];
}

export async function saveAgentPromptInApi(prompt: Partial<AgentPrompt>): Promise<AgentPrompt> {
  const res = await fetch('/api/agent-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  });
  if (!res.ok) throw new Error(`Failed to save agent prompt: ${res.statusText}`);
  const data = await res.json();
  return data.prompt;
}

export async function activateAgentPromptInApi(id: string, agentType: AgentType): Promise<void> {
  const res = await fetch(`/api/agent-prompts/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentType })
  });
  if (!res.ok) throw new Error(`Failed to activate agent prompt: ${res.statusText}`);
}

export async function deleteAgentPromptFromApi(id: string): Promise<boolean> {
  const res = await fetch(`/api/agent-prompts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete agent prompt: ${res.statusText}`);
  const data = await res.json();
  return Boolean(data.success);
}

export interface TestRunPromptPayload {
  systemPrompt: string;
  userPromptTemplate: string;
  variables: Record<string, string>;
  model: string;
  temperature: number;
}

export interface TestRunPromptResult {
  success: boolean;
  simulated?: boolean;
  isRateLimit?: boolean;
  latencyMs: number;
  model: string;
  outputText: string;
  error?: string;
}

export async function testRunAgentPromptInApi(payload: TestRunPromptPayload): Promise<TestRunPromptResult> {
  const res = await fetch('/api/agent-prompts/test-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data;
}


