import { describe, expect, it } from "vitest";
import {
  analyzeText,
  validateInput,
  MIN_WORDS,
  MEDIUM_THRESHOLD,
  HIGH_THRESHOLD,
} from "@/lib/analyzer";

const SCAM_MESSAGE = `Congratulations! You have been selected for a work from home job at a leading MNC.
No experience needed. Earn ₹5000 per day guaranteed income. No interview required, direct joining.
To confirm your slot, pay a small refundable registration fee of ₹999 via UPI.
Limited slots available — act fast, offer expires within 2 hours!
Kindly share your bank account number and Aadhaar card for verification.
Contact us on WhatsApp at hr.recruiter2024@gmail.com for immediate joining.`;

const SAFE_MESSAGE = `Software Engineering Intern — Acme Corp, Bengaluru.
We are looking for a motivated student to join our platform team for a 6-month internship.
You will work with senior engineers on our billing systems using TypeScript and PostgreSQL.
The process includes two technical interviews and one culture interview over video call.
Compensation is ₹25,000 per month. Apply through our careers page at acme.com/careers.
Feel free to reach out to careers@acme.com with any questions about the role.`;

// Borderline: only a free email address — a genuine small-business message.
const BORDERLINE_FREE_EMAIL = `Hi! We're a small bakery in Pune looking for a part-time social media helper.
You would post photos twice a week and reply to customer comments. Pay is ₹6,000 per month.
We'd like to meet you at the shop for a chat before deciding anything.
Write to us at sweetcrumbs.bakery@gmail.com and tell us a little about yourself.
Looking forward to hearing from you soon.`;

// Borderline: one weak signal only ("no experience required") in an otherwise normal posting.
const BORDERLINE_NO_EXPERIENCE = `Data Entry Assistant — Brightline Logistics, Chennai.
This is an entry-level role and no experience required; we provide two weeks of paid training.
You will update shipment records in our internal system during office hours, Monday to Friday.
Salary is ₹18,000 per month. Interviews are held in person at our Guindy office.
Apply via brightlinelogistics.in/careers or email jobs@brightlinelogistics.in with your resume.`;

const CHECK_FRAUD_MESSAGE = `We are pleased to offer you the position of personal assistant working remotely.
Your first task: we will mail you a check for ₹45,000. Deposit the check into your account,
keep ₹5,000 as your first week's pay, and wire the rest back to our office supplies vendor.
This is urgent, please confirm immediately once the check arrives.
Do not discuss this arrangement with anyone at your bank.`;

describe("validateInput", () => {
  it("rejects empty input", () => {
    expect(validateInput("   ")).toMatch(/paste/i);
  });

  it("rejects input shorter than the minimum word count", () => {
    expect(validateInput("too short message")).toContain(String(MIN_WORDS));
  });

  it("accepts a normal message", () => {
    expect(validateInput(SAFE_MESSAGE)).toBeNull();
  });
});

describe("analyzeText — suspicious offers", () => {
  it("flags a classic student scam as high risk with multiple warning signs", () => {
    const result = analyzeText(SCAM_MESSAGE);
    expect(result.level).toBe("high");
    expect(result.score).toBeGreaterThanOrEqual(HIGH_THRESHOLD);
    const ids = result.signs.map((s) => s.id);
    expect(ids).toContain("upfront-payment");
    expect(ids).toContain("no-interview");
    expect(ids).toContain("free-email");
    expect(ids).toContain("urgency");
  });

  it("flags check-deposit fraud as high risk", () => {
    const result = analyzeText(CHECK_FRAUD_MESSAGE);
    expect(result.level).toBe("high");
    const ids = result.signs.map((s) => s.id);
    expect(ids).toContain("check-fraud");
  });
});

describe("analyzeText — safe offers", () => {
  it("rates a legitimate internship posting as low risk with no signs", () => {
    const result = analyzeText(SAFE_MESSAGE);
    expect(result.level).toBe("low");
    expect(result.signs).toHaveLength(0);
    expect(result.score).toBe(0);
  });
});

describe("analyzeText — borderline cases", () => {
  it("keeps a single free-email signal below the medium threshold", () => {
    const result = analyzeText(BORDERLINE_FREE_EMAIL);
    expect(result.signs.map((s) => s.id)).toEqual(["free-email"]);
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(MEDIUM_THRESHOLD);
  });

  it("treats 'no experience required' alone as a weak, low-risk signal", () => {
    const result = analyzeText(BORDERLINE_NO_EXPERIENCE);
    expect(result.signs.map((s) => s.id)).toEqual(["no-experience-bait"]);
    expect(result.level).toBe("low");
  });
});

describe("analyzeText — consistency guarantees", () => {
  it("score always equals the sum of fired sign weights, capped at 100", () => {
    for (const msg of [SCAM_MESSAGE, SAFE_MESSAGE, BORDERLINE_FREE_EMAIL, CHECK_FRAUD_MESSAGE]) {
      const result = analyzeText(msg);
      const expected = Math.min(100, result.signs.reduce((sum, s) => sum + s.weight, 0));
      expect(result.score).toBe(expected);
    }
  });

  it("risk level is always consistent with the score thresholds", () => {
    for (const msg of [SCAM_MESSAGE, SAFE_MESSAGE, BORDERLINE_FREE_EMAIL, BORDERLINE_NO_EXPERIENCE, CHECK_FRAUD_MESSAGE]) {
      const result = analyzeText(msg);
      if (result.score >= HIGH_THRESHOLD) expect(result.level).toBe("high");
      else if (result.score >= MEDIUM_THRESHOLD) expect(result.level).toBe("medium");
      else expect(result.level).toBe("low");
    }
  });

  it("never reports the same rule twice and never repeats a match snippet across signs", () => {
    const result = analyzeText(SCAM_MESSAGE);
    const ids = result.signs.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const allMatches = result.signs.flatMap((s) => s.matches.map((m) => m.toLowerCase()));
    expect(new Set(allMatches).size).toBe(allMatches.length);
  });

  it("never returns a warning sign with no evidence", () => {
    for (const msg of [SCAM_MESSAGE, BORDERLINE_FREE_EMAIL, CHECK_FRAUD_MESSAGE]) {
      for (const sign of analyzeText(msg).signs) {
        expect(sign.matches.length).toBeGreaterThan(0);
      }
    }
  });

  it("always returns safety recommendations", () => {
    for (const msg of [SCAM_MESSAGE, SAFE_MESSAGE, BORDERLINE_FREE_EMAIL]) {
      expect(analyzeText(msg).recommendations.length).toBeGreaterThan(0);
    }
  });
});
