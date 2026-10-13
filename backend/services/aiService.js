// FixFlow AI Service (AI Issue Triage & Diagnostic Intelligence)
const https = require('https');

/**
 * Intelligent Fallback Triage when Gemini API is offline or key is missing
 */
function heuristicTriage(assetContext, userComplaint) {
  const text = (userComplaint || '').toLowerCase();
  const category = assetContext?.category || 'General';
  const assetName = assetContext?.name || 'Asset';

  let title = `${assetName} Malfunction Reported`;
  let suggestedCategory = category;
  let priority = 'Medium';
  let possibleCauses = ['General wear and tear', 'Loose connection or cable'];
  let initialChecks = [
    'Ensure device is safely powered off before touching internal components.',
    'Check physical connections and visible cables for damage.',
  ];

  if (text.includes('leak') || text.includes('water') || text.includes('drip')) {
    title = 'Fluid Leakage and Drainage Failure';
    suggestedCategory = 'Plumbing / HVAC';
    priority = 'High';
    possibleCauses = ['Clogged drain line', 'Damaged pipe seal or fitting', 'Frozen condenser coil melting'];
    initialChecks = [
      'Turn off unit immediately if water is near electrical wiring.',
      'Place containment basin to avoid property damage.',
      'Inspect external drainage hose for blockages.',
    ];
  } else if (text.includes('smoke') || text.includes('fire') || text.includes('spark') || text.includes('burn')) {
    title = 'Critical Electrical Spark or Thermal Hazard';
    suggestedCategory = 'Electrical / Safety';
    priority = 'Critical';
    possibleCauses = ['Short circuit', 'Overheated capacitor/transformer', 'Damaged wire insulation'];
    initialChecks = [
      'DO NOT TOUCH unit. Disconnect main power breaker immediately.',
      'Evacuate immediate area if smoke or burning smell persists.',
      'Require certified electrician inspection before re-energizing.',
    ];
  } else if (text.includes('flicker') || text.includes('hdmi') || text.includes('display') || text.includes('screen')) {
    title = 'Display Flickering and Signal Input Dropout';
    suggestedCategory = 'Electronics / Audio-Visual';
    priority = 'Medium';
    possibleCauses = ['Faulty HDMI/DisplayPort cable', 'Overheating graphics processor', 'Outdated display firmware/refresh rate'];
    initialChecks = [
      'Reseat HDMI cable on both device and display.',
      'Test with an alternate verified HDMI/power cable.',
      'Ensure cooling vents are unobstructed.',
    ];
  } else if (text.includes('noise') || text.includes('vibrat') || text.includes('sound') || text.includes('rattl')) {
    title = 'Abnormal Acoustic Vibration and Mechanical Friction';
    suggestedCategory = 'Mechanical';
    priority = 'High';
    possibleCauses = ['Worn bearing or rotor assembly', 'Loose mounting bolts', 'Foreign object inside housing'];
    initialChecks = [
      'Check if vibration increases with operation speed.',
      'Inspect external chassis screws and dampener pads.',
      'Do not operate continuously to prevent motor seizure.',
    ];
  } else if (text.includes('not turn on') || text.includes('dead') || text.includes('no power') || text.includes('power')) {
    title = 'Power Failure - Unit Inoperable';
    suggestedCategory = 'Power Supply';
    priority = 'High';
    possibleCauses = ['Blown internal fuse', 'Faulty power supply unit (PSU)', 'Tripped surge protector/socket'];
    initialChecks = [
      'Verify wall socket has active power with another device.',
      'Check fuse indicator / reset button on power strip.',
      'Inspect power cord for physical cuts or bent pins.',
    ];
  }

  // Recurring pattern detection
  const recentHistoryCount = Array.isArray(assetContext?.recentIssues) ? assetContext.recentIssues.length : 0;
  let recurringWarning = '';
  if (recentHistoryCount >= 2) {
    recurringWarning = `Attention: This asset has ${recentHistoryCount} reported incidents in recent history. Possible chronic root cause detected.`;
  }

  return {
    suggestedTitle: title,
    suggestedCategory,
    suggestedPriority: priority,
    possibleCauses,
    initialChecks,
    recurringWarning,
    wasAiUsed: true,
    engine: 'FixFlow Heuristic Diagnostic Engine',
  };
}

/**
 * Call Google Gemini API (if API Key provided)
 */
async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 7000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            resolve(JSON.parse(rawText));
          } else {
            reject(new Error('Invalid Gemini structure'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API request timed out'));
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

/**
 * AI Issue Triage entry point
 */
const triageIssue = async (assetContext, userComplaint) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('your_gemini')) {
    try {
      const prompt = `
You are the AI Maintenance Diagnostic Engine for FixFlow.
Analyze this asset context and user complaint, then return a JSON object with strictly these keys:
- suggestedTitle: concise professional issue title
- suggestedCategory: accurate technical category (e.g., Electronics, HVAC, Plumbing, Mechanical, Power Supply)
- suggestedPriority: one of ["Low", "Medium", "High", "Critical"]
- possibleCauses: array of 3-4 specific technical potential root causes
- initialChecks: array of 2-3 safe non-hazardous diagnostic steps
- recurringWarning: string warning if past history indicates repeat failure or empty string ""

Asset Context:
Name: ${assetContext?.name || 'N/A'}
Code: ${assetContext?.assetCode || 'N/A'}
Category: ${assetContext?.category || 'N/A'}
Location: ${JSON.stringify(assetContext?.location || {})}
Recent Incident Count: ${assetContext?.recentIssues?.length || 0}

User Complaint:
"${userComplaint}"

Important: Do NOT instruct users to handle open electrical wires or hazardous internals.
Return ONLY valid JSON.
`;

      const aiResponse = await callGemini(apiKey, prompt);
      if (aiResponse && aiResponse.suggestedTitle) {
        return {
          ...aiResponse,
          wasAiUsed: true,
          engine: 'Gemini 1.5 Flash',
        };
      }
    } catch (err) {
      console.warn(`[AI Service]: Gemini call fallback engaged (${err.message}). Using local diagnostic engine.`);
    }
  }

  // Robust fallback
  return heuristicTriage(assetContext, userComplaint);
};

module.exports = { triageIssue };
