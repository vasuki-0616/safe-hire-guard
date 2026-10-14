import { describe, expect, it } from "vitest";
import { analyzeText, validateInput, MIN_WORDS } from "@/lib/analyzer";

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

describe("analyzeText", () => {
  it("flags a scam message as high risk with multiple warning signs", () => {
    const result = analyzeText(SCAM_MESSAGE);
    expect(result.level).toBe("high");
    expect(result.score).toBeGreaterThanOrEqual(45);
    const ids = result.signs.map((s) => s.id);
    expect(ids).toContain("upfront-payment");
    expect(ids).toContain("no-interview");
    expect(ids).toContain("free-email");
    expect(ids).toContain("urgency");
  });

  it("rates a legitimate internship posting as low risk", () => {
    const result = analyzeText(SAFE_MESSAGE);
    expect(result.level).toBe("low");
    expect(result.signs).toHaveLength(0);
  });

  it("always returns safety recommendations", () => {
    for (const msg of [SCAM_MESSAGE, SAFE_MESSAGE]) {
      expect(analyzeText(msg).recommendations.length).toBeGreaterThan(0);
    }
  });
});
