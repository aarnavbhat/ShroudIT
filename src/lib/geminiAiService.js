/**
 * Google Gemini AI Document Analysis & Purpose Limitation Service
 * Connects directly to Google's Gemini models (gemini-2.5-flash / gemini-1.5-flash)
 * to dynamically read, comprehend, and categorize civic documents under DPDP Act §6.
 */

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash'
];

/**
 * System prompt instructing Gemini to analyze the civic document
 * and strictly enforce DPDP Act §6 purpose limitation rules.
 */
const SYSTEM_PROMPT = `You are an accredited AI Document Auditor and DPDP Act §6 Purpose Limitation Engine for the Government of Karnataka and ChronoForge / ShroudIT.

Your job is to read and analyze the provided verified document (which may be JSON, structured text, or text extract from a digital certificate).
You must dynamically determine:
1. What the document is (meaningful title, category, issuing authority, certificate/document reference number, and holder name).
2. What Zero-Knowledge predicates / categories the citizen is legally and factually ELIGIBLE for.
3. What categories the citizen is strictly DISQUALIFIED from under DPDP Act §6 purpose limitation.

MANDATORY STATUTORY ELIGIBILITY & PURPOSE LIMITATION RULES:
1. Income Welfare Rule (DPDP Act §6 Statutory Ceiling):
   - If the stated annual income / salary / CTC is greater than ₹3,00,000 (3 Lakhs INR), the citizen is strictly DISQUALIFIED from:
     * "Annual Income ≤ ₹3,00,000" (id: "income_below_3L")
     * "Welfare Subsidy Eligible (Yuva Nidhi)" (id: "welfare_eligible")
     You MUST add these to "disqualifiedCategories" with the exact reason explaining that income exceeds the statutory ₹3,00,000 threshold.
     DO NOT include them in "allowedPredicates". Instead, grant "Tax Assessed Resident" (id: "income_tax_assessed").
   - If stated annual income is <= ₹3,00,000, grant "income_below_3L" and "welfare_eligible".
2. Age Criteria:
   - If the person's age is under 18 (based on date of birth), DISQUALIFY "Age ≥ 18" (id: "over_18") and grant "Minor Resident (< 18)" (id: "minor_resident").
   - If 18 or older, grant "Age ≥ 18" (id: "over_18").
3. Contextual Domain Specialization:
   - If it is a Student / Educational / Transit Pass document, formulate student predicates like "Accredited Student" (id: "valid_student") and "Transit Concession" (id: "tier1_concession").
   - If it is a Cybersecurity / Technical Skill Certification, formulate skill predicates like "Certified Cybersecurity Analyst" (id: "certified_analyst") and "Valid Skill Attestation" (id: "cert_valid_2026").
   - DO NOT grant cybersecurity analyst predicates to income or student certificates!
4. Domicile / Jurisdiction:
   - If document mentions Bengaluru / BBMP, grant "Bengaluru Resident" (id: "blr_resident").
   - If Karnataka, grant "Karnataka Domicile" (id: "karnataka_domicile").

Respond with STRICT JSON only matching this schema:
{
  "title": "Descriptive title of what the file is (e.g. Verified Government Income & Asset Certificate)",
  "category": "Broad Category (e.g. Socio-Economic Welfare Eligibility, Public Transit Concession, Technical Accreditation)",
  "issuer": "Official department or issuing agency",
  "documentNumber": "Document or certificate reference ID",
  "holderName": "Full name of citizen",
  "summary": "1-2 sentence AI overview of document contents and validity",
  "aiDecisions": ["Clear step-by-step rationale for why each option was approved or blocked"],
  "allowedPredicates": [
    {
      "id": "predicate_id",
      "label": "Human readable label",
      "statement": "Formal verification statement",
      "value": true,
      "derivedFrom": "Specific field or value from document"
    }
  ],
  "disqualifiedCategories": [
    {
      "id": "category_id",
      "label": "Human readable label",
      "reason": "Legal or statutory reason why this was suppressed"
    }
  ]
}`;

/**
 * Analyzes a civic document using Google Gemini REST API
 * @param {Object} options
 * @param {Object|string} options.document The document object or text
 * @param {string} [options.rawText] The raw file text
 * @param {string} options.apiKey Google Gemini API Key
 * @returns {Promise<Object>} Structured AI evaluation result
 */
export async function queryGeminiDocumentAnalysis({ document, rawText, apiKey }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error("Missing Gemini API Key. Please provide a valid Google Gemini API Key.");
  }

  const cleanApiKey = apiKey.trim();

  // Prepare text payload for the model
  let docPayloadText = '';
  if (typeof document === 'object' && document !== null) {
    if (typeof document.text === 'string') {
      docPayloadText = `Embedded Document Text:\n${document.text}\n\nWrapper Metadata:\n${JSON.stringify(document, null, 2)}`;
    } else {
      docPayloadText = JSON.stringify(document, null, 2);
    }
  } else if (typeof document === 'string') {
    docPayloadText = document;
  }

  if (rawText && rawText !== docPayloadText) {
    docPayloadText += `\n\nRaw Uploaded File Contents:\n${rawText}`;
  }

  const userPrompt = `${SYSTEM_PROMPT}\n\n====================\nDOCUMENT TO ANALYZE:\n${docPayloadText}\n====================\n\nReturn strict JSON following the requested schema:`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error [${response.status}] with model ${model}: ${errorBody}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error(`Gemini returned empty response for model ${model}`);
      }

      // Clean markdown code fences if model enclosed in ```json ... ```
      const cleanedJsonText = candidateText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJsonText);
      
      return {
        success: true,
        model: model,
        data: parsed
      };
    } catch (err) {
      lastError = err;
      // If error is 404/503 or model not found/temporarily unavailable, continue to next model in list
      if (err.message.includes('404') || err.message.includes('503') || err.message.includes('not found') || err.message.includes('unavailable') || err.message.includes('no longer available')) {
        continue;
      }
      // If error is invalid API key or permission denied, throw immediately
      if (err.message.includes('400') || err.message.includes('403') || err.message.includes('API_KEY_INVALID')) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to communicate with Google Gemini API.");
}
