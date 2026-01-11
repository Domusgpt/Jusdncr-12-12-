export type BugImpact = 'minor' | 'major' | 'blocker';

export interface BugReport {
  id: string;
  email: string;
  description: string;
  impact: BugImpact;
  page?: string;
  createdAt: string;
}

const STORAGE_KEY = 'jusdnce_bug_reports';

const loadReports = (): BugReport[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read bug reports from storage', err);
    return [];
  }
};

const persistReports = (reports: BugReport[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const submitBugReport = async (
  payload: Omit<BugReport, 'id' | 'createdAt'>
): Promise<BugReport> => {
  const report: BugReport = {
    ...payload,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  // Simulate async submission + local persistence for offline usage.
  const existing = loadReports();
  const next = [report, ...existing].slice(0, 100);
  persistReports(next);

  return report;
};

export const listBugReports = (): BugReport[] => loadReports();
