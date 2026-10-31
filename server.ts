import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

/**
 * Shared server-side Gemini client helper.
 * User-Agent telemetry set according to AI Studio guidelines.
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FinPilot AI Full-Stack Server',
  });
});

// Gemini status check endpoint
app.get('/api/gemini/status', (_req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');
  res.json({
    configured: isConfigured,
    provider: 'gemini-3.8-flash',
  });
});

// Grounded Financial Advisory Commentary
app.post('/api/gemini/generate-advisory', async (req: Request, res: Response) => {
  try {
    const { insights = [], currency = 'USD' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        available: false,
        message: 'No server-side Gemini API key configured. Deterministic fallback advised.',
      });
    }

    const factsList = (insights || []).slice(0, 8).map((i: any) => ({
      title: i.title,
      category: i.category,
      severity: i.severity,
      evidence: i.evidenceSummary,
      formula: i.calculationFormula || 'Heuristic check',
      limitations: (i.knownLimitations || []).join(', '),
    }));

    const systemPrompt = `You are FinPilot AI's Financial Advisory Analyst.
You are provided with verified, deterministic financial figures and rule-based alerts for a business operating in ${currency}.
Strict Rules:
1. Ground your explanation EXCLUSIVELY in the supplied metrics below.
2. DO NOT invent new numbers, percentages, or transaction IDs.
3. DO NOT claim financial safety, creditworthiness, or guaranteed future revenue.
4. DO NOT provide regulated tax, audit, legal, or investment advice.
5. Provide a 2-3 paragraph executive summary, 3-5 concrete observations, and 3 pertinent management follow-up questions.
Output must be valid JSON matching this schema:
{
  "executiveSummary": "...",
  "bulletedObservations": ["...", "..."],
  "suggestedFollowUpQuestions": ["...", "..."]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nSUPPLIED GROUNDING METRICS:\n${JSON.stringify(factsList, null, 2)}` },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        available: true,
        executiveSummary: parsed.executiveSummary || '',
        bulletedObservations: parsed.bulletedObservations || [],
        suggestedFollowUpQuestions: parsed.suggestedFollowUpQuestions || [],
        provider: 'gemini-3.8-flash',
        groundedFactsCount: factsList.length,
        generatedAt: new Date().toISOString(),
      });
    }

    return res.status(502).json({
      available: false,
      error: 'Empty response returned from model',
    });
  } catch (err: any) {
    console.error('Advisory generation error:', err);
    return res.status(500).json({
      available: false,
      error: err?.message || 'Server-side advisory generation failed',
    });
  }
});

// Executive Report Commentary
app.post('/api/gemini/generate-report-commentary', async (req: Request, res: Response) => {
  try {
    const {
      entityName = 'Company',
      currency = 'USD',
      summaryKpis = {},
      operationsReceivables = {},
    } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        available: false,
        message: 'No server-side Gemini API key configured. Deterministic fallback advised.',
      });
    }

    const prompt = `You are the Lead Financial Controller presenting an Executive Report for "${entityName}".
Strict Grounding Data:
- Currency: ${currency}
- Total Revenue: ${(summaryKpis.totalRevenue || 0).toLocaleString()}
- Total Expenses: ${(summaryKpis.totalExpenses || 0).toLocaleString()}
- Net Operating Income: ${(summaryKpis.netOperatingIncome || 0).toLocaleString()} (${summaryKpis.operatingMarginPercent || 0}% Operating Margin)
- Cash & Equivalents: ${(summaryKpis.cashAndEquivalents || 0).toLocaleString()}
- Outstanding Receivables: ${(summaryKpis.outstandingReceivables || 0).toLocaleString()} (Collection rate: ${operationsReceivables.collectionRatePercent || 0}%)
- Bank Match Rate: ${summaryKpis.reconciliationMatchRate || 0}%
- Projected Next Quarter Revenue: ${(summaryKpis.forecastProjectedRevenueNextQuarter || 0).toLocaleString()}

Requirements:
1. Provide a professional, concise 2-paragraph C-suite executive briefing.
2. Highlight profitability, liquidity, and operational execution.
3. List 3 key management action priorities based ONLY on the numbers above.
4. DO NOT invent facts or give speculative tax/investment advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const commentaryText = response.text?.trim() || '';
    return res.json({
      available: true,
      text: commentaryText,
      provider: 'gemini-3.8-flash',
      groundedFactsCount: 8,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Report commentary generation error:', err);
    return res.status(500).json({
      available: false,
      error: err?.message || 'Server-side report commentary generation failed',
    });
  }
});

// Server-Sent Events (SSE) Streaming endpoint for Gemini
app.post('/api/gemini/stream', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured on server' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Gemini stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err?.message || 'Stream generation failed' })}\n\n`);
    res.end();
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`FinPilot AI server active at http://0.0.0.0:${port} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize FinPilot AI server:', err);
  process.exit(1);
});
