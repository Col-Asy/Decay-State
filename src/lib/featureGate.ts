export type Tier = "observer" | "operator";

export type FeatureConfig = {
  maxMandates: number; // max total active mandates
  maxJournal: number; // max total journal entries
  maxGoals: number; // max active missions at once
  maxConversations: number; // AI chat conversation threads
  maxAiMessages: number; // messages per 24h
  maxAiMandates: number; // AI mandate generation per 24h
  weeklyEvolution: boolean; // weekly image evolution
  decayRecovery: boolean; // decay recovery protocols
  activityLogHours: number; // how many hours of log history
};

const OBSERVER: FeatureConfig = {
  maxMandates: 5,
  maxJournal: 10,
  maxGoals: 1,
  maxConversations: 3,
  maxAiMessages: 10,
  maxAiMandates: 3,
  weeklyEvolution: false,
  decayRecovery: false,
  activityLogHours: 24,
};

const OPERATOR: FeatureConfig = {
  maxMandates: Infinity,
  maxJournal: Infinity,
  maxGoals: Infinity,
  maxConversations: Infinity,
  maxAiMessages: Infinity,
  maxAiMandates: 20,
  weeklyEvolution: true,
  decayRecovery: true,
  activityLogHours: 24 * 365, // 1 year
};

export function getFeatureConfig(tier: Tier): FeatureConfig {
  return tier === "operator" ? OPERATOR : OBSERVER;
}

export function isAtLimit(current: number, max: number): boolean {
  return max !== Infinity && current >= max;
}
