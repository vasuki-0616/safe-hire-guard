/**
 * TrustHire AI — transparent, rule-based risk analyzer.
 *
 * This is NOT a machine-learning model. It scores text against an
 * explainable set of warning rules and reports exactly which rules
 * fired. An AI analysis service can later replace `analyzeText`
 * behind the same interface.
 */

export type RiskLevel = "low" | "medium" | "high";

export interface WarningSign {
  id: string;
  title: string;
  reason: string;
  weight: number;
  matches: string[];
}

export interface AnalysisResult {
  score: number; // 0–100
  level: RiskLevel;
  signs: WarningSign[];
  recommendations: string[];
  wordCount: number;
}

interface Rule {
  id: string;
  title: string;
  reason: string;
  weight: number;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    id: "upfront-payment",
    title: "Requests money or fees upfront",
    reason:
      "Legitimate employers never ask candidates to pay for registration, training, equipment, or 'refundable deposits'.",
    weight: 30,
    patterns: [
      /\b(registration|processing|training|security|refundable)\s+(fee|deposit|charge)/i,
      /\bpay\s+(a\s+)?(small\s+)?(fee|deposit|amount)/i,
      /\b(send|transfer|wire)\s+(money|payment|funds)/i,
      /\bupfront\s+(payment|fee|cost)/i,
    ],
  },
  {
    id: "gift-cards-crypto",
    title: "Mentions gift cards or cryptocurrency",
    reason:
      "Requests involving gift cards, Bitcoin, or USDT are a hallmark of job scams because these payments are untraceable.",
    weight: 30,
    patterns: [
      /\bgift\s*cards?\b/i,
      /\b(bitcoin|btc|crypto|usdt|ethereum)\b/i,
      /\bitunes\s+card/i,
    ],
  },
  {
    id: "personal-data",
    title: "Asks for sensitive personal or banking details",
    reason:
      "Real employers collect banking or ID details only after a formal offer, through secure HR systems — never over chat or email.",
    weight: 25,
    patterns: [
      /\b(bank\s+account|account\s+number|routing\s+number|ifsc)\b/i,
      /\b(otp|one[- ]time\s+password|cvv|card\s+number)\b/i,
      /\b(aadhaar|aadhar|pan\s+card|social\s+security|ssn|passport\s+number)\b/i,
      /\bshare\s+your\s+(id|identity)\s+(proof|card)/i,
    ],
  },
  {
    id: "free-email",
    title: "Uses a free email address instead of a company domain",
    reason:
      "Recruiters from real companies almost always email from their company domain (e.g. @company.com), not Gmail or Yahoo.",
    weight: 15,
    patterns: [
      /[\w.+-]+@(gmail|yahoo|hotmail|outlook|rediffmail|protonmail)\.(com|in|co\.in)/i,
    ],
  },
  {
    id: "messaging-app",
    title: "Moves the conversation to WhatsApp/Telegram",
    reason:
      "Scammers push candidates to messaging apps to avoid platform reporting and official records.",
    weight: 15,
    patterns: [
      /\b(whatsapp|telegram|signal)\b.{0,40}\b(contact|message|chat|interview|reply)/i,
      /\b(contact|message|interview)\b.{0,40}\b(whatsapp|telegram)\b/i,
    ],
  },
  {
    id: "urgency",
    title: "Creates artificial urgency or pressure",
    reason:
      "Phrases like 'limited slots' or 'apply within 2 hours' pressure you into skipping verification.",
    weight: 12,
    patterns: [
      /\b(urgent|immediately|right\s+now|act\s+fast|hurry)\b/i,
      /\blimited\s+(slots?|seats?|positions?|time)\b/i,
      /\bwithin\s+\d+\s+(hours?|days?)\b/i,
      /\boffer\s+expires?\b/i,
    ],
  },
  {
    id: "too-good-pay",
    title: "Unrealistically high pay for little work",
    reason:
      "Very high pay for 'no experience' or a few hours of simple work is a classic bait used to lure students.",
    weight: 15,
    patterns: [
      /\b(no\s+experience|no\s+skills?)\s+(needed|required|necessary)\b/i,
      /\b(earn|make|get)\s+[^\n.]{0,30}(\$\s?\d{3,}|₹\s?\d{4,}|\d{4,}\s?(rs|inr|usd))\s*(per|\/|a)\s*(day|week)/i,
      /\b(work\s+from\s+home).{0,50}(easy|simple)\s+(money|income)/i,
      /\b(unlimited|guaranteed)\s+(income|earnings?)\b/i,
    ],
  },
  {
    id: "no-interview",
    title: "Offers the job with no interview",
    reason:
      "Being 'selected' or 'hired immediately' without any interview or verification is a strong scam signal.",
    weight: 20,
    patterns: [
      /\b(no\s+interview|without\s+(an?\s+)?interview)\b/i,
      /\b(you\s+are|you'?ve\s+been)\s+(selected|hired|chosen)\b/i,
      /\bimmediate\s+(joining|selection|hiring)\b/i,
      /\bdirect\s+(joining|placement)\b/i,
    ],
  },
  {
    id: "vague-company",
    title: "Vague or missing company details",
    reason:
      "Real offers name the company, role, and reporting structure. Generic phrases like 'a leading MNC' hide the sender's identity.",
    weight: 10,
    patterns: [
      /\b(a\s+leading|reputed|top)\s+(mnc|company|firm|organization)\b/i,
      /\bwell[- ]known\s+company\b/i,
    ],
  },
  {
    id: "poor-language",
    title: "Excessive capitalization or spelling red flags",
    reason:
      "Professional recruiters write carefully. Heavy ALL-CAPS and words like 'kindly revert' are common in scam templates.",
    weight: 8,
    patterns: [/\bkindly\s+(revert|share|send|do\s+the\s+needful)\b/i, /\bdo\s+the\s+needful\b/i],
  },
];

const RECOMMENDATIONS: Record<RiskLevel, string[]> = {
  low: [
    "Still verify the company: check its official website and LinkedIn page.",
    "Confirm the recruiter's email matches the company's real domain.",
    "Never pay any fee or share banking/ID details before a signed offer.",
  ],
  medium: [
    "Do not pay any fee, deposit, or 'training cost' — real employers never ask.",
    "Search the company name plus 'scam' or 'reviews' before responding.",
    "Ask for a written offer on official letterhead and a video interview.",
    "Never share OTPs, bank account numbers, or ID documents over chat.",
  ],
  high: [
    "Do not respond, pay money, or share personal documents.",
    "Do not click links or download attachments from this message.",
    "Report the message to your placement cell and the platform it arrived on.",
    "Warn classmates — these messages are usually sent in bulk to students.",
  ],
};

export const MIN_WORDS = 20;
export const MAX_CHARS = 20000;

export function validateInput(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Please paste a job description or recruiter message first.";
  const words = trimmed.split(/\s+/).length;
  if (words < MIN_WORDS)
    return `That looks too short to analyze (${words} words). Paste the full message — at least ${MIN_WORDS} words.`;
  if (trimmed.length > MAX_CHARS)
    return `That text is too long (${trimmed.length.toLocaleString()} characters). Please keep it under ${MAX_CHARS.toLocaleString()}.`;
  return null;
}

export function analyzeText(text: string): AnalysisResult {
  const signs: WarningSign[] = [];

  for (const rule of RULES) {
    const matches = new Set<string>();
    for (const pattern of rule.patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
      for (const m of text.matchAll(re)) {
        if (m[0]) matches.add(m[0].trim());
        if (matches.size >= 3) break;
      }
      if (matches.size >= 3) break;
    }
    if (matches.size > 0) {
      signs.push({
        id: rule.id,
        title: rule.title,
        reason: rule.reason,
        weight: rule.weight,
        matches: [...matches],
      });
    }
  }

  // ALL-CAPS density check (only meaningful on longer text)
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 80) {
    const caps = text.replace(/[^A-Z]/g, "").length;
    if (caps / letters.length > 0.35) {
      const rule = RULES.find((r) => r.id === "poor-language")!;
      if (!signs.some((s) => s.id === rule.id)) {
        signs.push({
          id: rule.id,
          title: rule.title,
          reason: "A large share of this message is written in ALL CAPITAL LETTERS, which is unusual for professional recruiters.",
          weight: rule.weight,
          matches: ["Excessive capitalization detected"],
        });
      }
    }
  }

  signs.sort((a, b) => b.weight - a.weight);
  const score = Math.min(100, signs.reduce((sum, s) => sum + s.weight, 0));
  const level: RiskLevel = score >= 45 ? "high" : score >= 20 ? "medium" : "low";

  return {
    score,
    level,
    signs,
    recommendations: RECOMMENDATIONS[level],
    wordCount: text.trim().split(/\s+/).length,
  };
}
