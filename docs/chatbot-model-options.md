# Chatbot Model Options — Cheaper Cross-Vendor Analysis

**Owner:** infra (Hao) + PM (Amelia) · **Updated:** 2026-06-09 · **Status:** analysis / recommendation

> Question from the owner: *"think deeper about getting a cheaper model for the
> chatbot from other (open-source) vendors."* Short answer: **yes — there are
> solid models ~6–16× cheaper than our current default (Claude Haiku 4.5), and
> the concierge workload is simple enough that they'd hold up.** We've shipped
> Haiku 4.5 now (great quality, trivial cost at low volume); this doc is the
> playbook for dropping cost when volume makes it matter.
>
> ⚠️ Prices below were gathered **June 2026** from vendor/aggregator pages and
> change often (and sources sometimes disagree). Re-check the linked source
> before quoting externally or wiring a contract.

---

## 1. Our workload (why "cheap" is easy here)

The concierge answers short travel Q&A. Per message, roughly:
- **~900 input tokens** (≈500-token system prompt + a few turns of history)
- **~150 output tokens** (concise, ≤70-word replies — enforced by the prompt)

That's a **low-output, bursty** shape. Output tokens dominate cost, and our
replies are short — so output price matters most, and the absolute spend is tiny
until we reach serious volume.

---

## 2. Current default — Claude Haiku 4.5

| | Input $/1M | Output $/1M | Cost per 10k messages\* |
|---|---|---|---|
| **Claude Haiku 4.5** (current) | $1.00 | $5.00 | **$16.50** |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $49.50 |
| Claude Opus 4.8 | $5.00 | $25.00 | $82.50 |

\* Workload model: 900 in + 150 out per message → `$/10k = 9·in + 1.5·out`.

Haiku 4.5 is excellent for a brand-facing concierge (top-tier instruction
following, safety, consistent tone) and at low volume the cost is negligible.
The case for switching is **scale** (millions of messages), not the first few thousand.

---

## 3. Cheaper alternatives (current pricing, June 2026)

### Hosted open-source models (open weights — portable, no lock-in)

| Model · host | Input $/1M | Output $/1M | Per 10k\* | Notes |
|---|---|---|---|---|
| **Llama 3.3 70B · DeepInfra** | $0.23 | $0.40 | **$2.67** | Cheapest 70B host; strong general quality |
| Llama 3.3 70B · Groq | $0.59 | $0.79 | $6.50 | Fastest (LPU, ~400 tok/s) |
| Llama 3.3 70B · Together | $0.88 (flat) | $0.88 | $9.25 | — |
| Llama 3.1 8B · Groq | $0.05 | $0.08 | **$0.57** | Ultra-cheap/fast; quality risk for nuanced tone |
| Qwen 2.5 72B · DeepInfra | ~$0.23 | ~$0.23 | ~$2.42 | ~1/10th of GPT-4o-class input |
| DeepSeek V3 · DeepSeek API | $0.14 | $0.28 | **$1.68** | Cheap + capable; see privacy note |

### Cheap proprietary models (managed, strong privacy posture)

| Model | Input $/1M | Output $/1M | Per 10k\* | Notes |
|---|---|---|---|---|
| **Google Gemini 2.5 Flash-Lite** | $0.10 | $0.40 | **$1.50** | Big-vendor, fast, 1M context |
| **OpenAI GPT-5 nano** | $0.05 | $0.40 | **$1.05** | Cheapest big-vendor tier |
| Google Gemini 2.5 Flash | $0.30 | $2.50 | $6.45 | Step up in quality |
| OpenAI GPT-5 mini | $0.25 | $2.00 | $5.25 | Step up in quality |

### Aggregator

- **OpenRouter** — one OpenAI-compatible API in front of *all* of the above.
  Switch models with a string, automatic fallback/routing, pay-as-you-go, and a
  **free tier** (rate-limited: ~20 req/min, 200/day) covering Llama 3.3 70B,
  DeepSeek, Gemma, and Llama 4 Maverick — ideal for dev/staging.

\* Same 900-in/150-out workload model.

---

## 4. The headline

Against Haiku 4.5's **$16.50 / 10k messages**, realistic swaps land at:

| Option | Per 10k | vs Haiku |
|---|---|---|
| GPT-5 nano | $1.05 | **~16× cheaper** |
| Gemini 2.5 Flash-Lite | $1.50 | ~11× cheaper |
| DeepSeek V3 | $1.68 | ~10× cheaper |
| Llama 3.3 70B (DeepInfra) | $2.67 | ~6× cheaper |
| Groq Llama 3.1 8B | $0.57 | ~29× cheaper (quality risk) |

At **1M messages/month**, that's ~$1,650 on Haiku vs ~$105–270 on the cheap tier —
a real lever once we have traffic. Below ~50k messages/month the difference is a
few dollars and not worth optimizing.

---

## 5. Decision factors beyond price

| Factor | Takeaway |
|---|---|
| **Quality for concierge tone** | 70B-class (Llama 3.3 70B, Qwen 72B), DeepSeek V3, Gemini Flash-Lite, GPT-5 nano/mini are all good enough for short travel Q&A. **Avoid 8B** (Groq Llama 8B) for brand voice — fine for blunt FAQ only. |
| **Data privacy** | Anthropic / OpenAI / Google: API data not trained on (enterprise terms). **DeepSeek's first-party API is China-hosted** — for residency comfort, run DeepSeek/Llama **weights on a US host** (DeepInfra/Together/Fireworks) instead. |
| **Latency** | Groq is fastest; Gemini Flash-Lite and GPT nano are fast + reliable. All stream via SSE. |
| **Integration** | Nearly all expose an **OpenAI-compatible** `/chat/completions` endpoint → swap base URL + key + model string. Streaming parses `choices[].delta.content` (vs Anthropic's `content_block_delta`). |
| **Lock-in** | Open weights (Llama/Qwen/DeepSeek) are portable across hosts; proprietary (Gemini/GPT/Claude) are not. OpenRouter abstracts both. |

---

## 6. Recommendation

- **Now:** stay on **Claude Haiku 4.5** (already shipped). Quality/safety for a
  brand-facing concierge, and cost is immaterial at current volume.
- **When volume grows (the cost lever):** move to **Gemini 2.5 Flash-Lite** or
  **OpenAI GPT-5 nano** (managed, ~10–16× cheaper, strong privacy, easiest) — or
  **Llama 3.3 70B on DeepInfra** if we want open weights / no lock-in.
- **For dev/experimentation:** **OpenRouter** free tier to A/B models with one key.
- **Don't** drop to 8B-class for the customer-facing concierge.

### Make it a one-env-var switch (small follow-up)

Generalise `src/lib/assistant.ts` + `src/app/api/assistant/route.ts` behind a
tiny **provider seam** (mirrors the backend's provider-adapter pattern):

```
CHAT_PROVIDER = anthropic | openai-compatible      # default anthropic
CHAT_BASE_URL = https://api.openai.com/v1 | https://openrouter.ai/api/v1 | …
CHAT_API_KEY  = <key>
CHAT_MODEL    = gpt-5-nano | google/gemini-2.5-flash-lite | meta-llama/llama-3.3-70b-instruct
```

Because most vendors speak the OpenAI `/chat/completions` shape, one
OpenAI-compatible client covers Gemini (via its compat endpoint), OpenAI, Groq,
Together, DeepInfra, DeepSeek, and OpenRouter — keeping Anthropic as the default.
Streaming swaps the SSE parser (`parseSseTextDelta`) for the OpenAI delta shape.
**Estimated effort: ~half a day, fully test-gated.** Say the word and it's built.

---

## Sources (gathered 2026-06-09)

- [Groq pricing](https://groq.com/pricing) · [CloudZero — Groq pricing 2026](https://www.cloudzero.com/blog/groq-pricing/)
- [Together AI pricing](https://www.together.ai/pricing) · [AI Pricing Guru — Together](https://www.aipricing.guru/together-pricing/)
- [DeepInfra pricing](https://deepinfra.com/pricing) · [Price Per Token — DeepInfra vs Fireworks](https://pricepertoken.com/endpoints/compare/deepinfra-vs-fireworks) · [CostBench — DeepInfra](https://costbench.com/software/llm-api-providers/deepinfra/)
- [Fireworks AI pricing](https://fireworks.ai/pricing)
- [DeepSeek API pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [Google Gemini 2.5 Flash-Lite pricing](https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash-lite) · [Gemini 2.5 Flash pricing](https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash)
- [OpenAI API pricing](https://openai.com/api/pricing/) · [GPT-5 nano](https://pricepertoken.com/pricing-page/model/openai-gpt-5-nano) · [GPT-5 mini](https://pricepertoken.com/pricing-page/model/openai-gpt-5-mini)
- [OpenRouter models](https://openrouter.ai/models) · [OpenRouter free models (Jun 2026)](https://costgoat.com/pricing/openrouter-free-models)
- Anthropic pricing: Claude Haiku 4.5 $1/$5, Sonnet 4.6 $3/$15, Opus 4.8 $5/$25 (Anthropic model catalog)
