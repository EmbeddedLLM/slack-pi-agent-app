# Costs

What it takes to run the bot, in money and in time. The bot's code and pi cost nothing; the costs are Slack, a server, the model, and web search.

::: warning Prices change
Prices on this page were checked on **17 November 2026** from the sources at the bottom. Cloud GPU prices especially move week to week. Check the providers' own pricing pages before you budget.
:::

## Summary

For a team of about 10 people (usage assumptions [below](#usage-assumptions)):

| Setup | Monthly cost (USD) | Best when |
|---|---|---|
| **A. Hosted model API** + small VM | **≈ $25 – $210** | Most small teams. Pay per use. |
| **B. Self-hosted model, rented GPU, always on** | **≈ $1,750 – $1,950** | Data must stay on infrastructure you control, or many teams share the GPU. |
| **C. Self-hosted, rented GPU, office hours only** | **≈ $550 – $630** | Like B, but the bot is unavailable outside working hours. |
| **D. Self-hosted on hardware you already own** | Electricity and admin time | You have a spare GPU server. |

Each row is built from the parts below.

## Slack

| Plan | Price | What matters for the bot |
|---|---|---|
| **Free** | $0 | Works. A custom app counts toward the **10-app limit** per workspace. Message history is limited to **90 days**, and the bot can't read older messages either. |
| **Pro** | $8.75 per user per month (monthly), $7.25 (yearly) | Unlimited apps, full history. 10 users ≈ $73 – $88 per month. |
| **Business+** | $15 per user per month (yearly) | Not needed for the bot. |

Socket Mode, buttons, dialogs and the Home tab work on every plan. **You only need to pay** if you hit the app limit or need history older than 90 days.

## The bot server

The bot itself is a small Node.js process. PDF output briefly starts a headless Chromium.

| Option | Typical cost |
|---|---|
| A small cloud VM (2 vCPU, 4 GB RAM) | roughly $10 – $40 per month, depending on provider and region |
| On the same machine as the model server | $0 extra |

No load balancer, public IP or domain is needed (Socket Mode).

## The model

This is the biggest choice.

### Option 1: a hosted model API (TokenVisor or another provider)

You pay per token, at your provider's rates. Monthly cost:

> **cost = input tokens (millions) × input price + output tokens (millions) × output price**

With the [usage assumptions](#usage-assumptions) below, about **35 M input** and **3 M output** tokens per month. At example prices (scenarios, **not quotes**):

| Price per 1 M tokens (input / output) | Monthly model cost |
|---|---|
| $0.10 / $0.50 | ≈ $5 |
| $0.25 / $1.00 | ≈ $12 |
| $1.00 / $4.00 | ≈ $47 |
| $3.00 / $15.00 | ≈ $150 |

Small mixture-of-experts models such as Qwen3.6-35B-A3B are usually at the low end of hosted pricing.

### Option 2: self-host with vLLM on a rented GPU

You pay for GPU time whether or not anyone asks anything. `Qwen/Qwen3.6-35B-A3B` needs about 70 GB for its 16-bit weights, plus memory for the context cache ([sizing](/setup/model#b-self-hosted-vllm)).

| GPU setup | On-demand price per GPU-hour | Always on (730 h) | Office hours (220 h) |
|---|---|---|---|
| 1 × AMD MI300X (192 GB) | $2.39 – $2.59 (RunPod, DigitalOcean) | **$1,745 – $1,891** | $526 – $570 |
| 1 × NVIDIA H100 80 GB, FP8 weights | $2.69 – $3.25 (provider list price to market median) | $1,964 – $2,373 | $592 – $715 |
| 2 × NVIDIA H100 80 GB, 16-bit weights | same, × 2 | $3,927 – $4,745 | $1,184 – $1,430 |

"Office hours" assumes 10 hours a day on 22 working days, with the GPU stopped otherwise. Spot and reserved prices are lower; big-cloud list prices can be about twice as high.

**Break-even.** A rented GPU running all month costs about as much as 35 M input tokens at roughly $50 per million: far above typical hosted prices for this model size. For one small team, self-hosting rarely saves money. Choose it for **data control**, or when many teams share one GPU (a single MI300X serves far more than `MAX_CONCURRENT_JOBS=2`).

### Option 3: hardware you own

The cost is power and maintenance. A busy 750 W GPU server running all month uses about 550 kWh; multiply by your electricity price.

## Web search (Exa)

Used by the web search tools and by deep research.

| Exa product | Price |
|---|---|
| Search with page contents (10 results) | $7 per 1,000 requests |
| Each result beyond 10 | $1 per 1,000 |
| Contents only | $1 per 1,000 pages |
| Exa Deep search | $12 per 1,000 requests |

With the assumptions below, about 1,000 chat searches plus 400 – 1,200 deep research searches a month: **≈ $10 – $16 per month**. New accounts get free credits.

## GitHub (for this documentation)

| Repository | GitHub Pages |
|---|---|
| Public | Free |
| Private, organization | Needs GitHub **Team**, about $4 per user per month |
| Private site visible only to members | Needs GitHub **Enterprise Cloud** |

## People's time

| Task | Time |
|---|---|
| First setup (Slack app, server, model, access list) | half a day to a day |
| Self-hosting the model (GPU server, vLLM, tool-call checks) | add a day |
| Routine upkeep: access list, updates, log checks | 1 – 2 hours a month |

## Usage assumptions

The estimates above use a team of **10 people** on **22 working days a month**:

| Assumption | Value |
|---|---|
| Chat requests | 5 per person per day → **1,100 per month** |
| Tokens per chat request | ≈ 20,000 input (instructions, Slack history, files, tool results), ≈ 2,000 output (thinking and answer) |
| Requests using web search | 30%, about 3 searches each |
| Deep research runs | **20 per month**, about 20 – 60 searches and 0.3 – 1 M tokens each (these vary most; measure your own) |

**Measuring your own usage:**

- **Requests:** the bot logs every request as a `job` line, with `promptChars` and `replyChars`; four characters are roughly one token for English.
- **Tokens:** the `pi-token-speed` package and your model provider's dashboard show exact token counts.
- **Searches:** Exa's dashboard shows search counts.

## Keeping costs down

| Setting | Effect |
|---|---|
| `MAX_CONCURRENT_JOBS`, `MAX_JOBS_PER_USER`, role `maxJobs` | Cap parallel use |
| `CONTEXT_CHAR_BUDGET`, `ATTACHMENT_CHAR_BUDGET`, `HISTORY_LIMIT` | Fewer input tokens per request |
| `PI_TIMEOUT_MS`, `RESEARCH_TIMEOUT_MS` | Stop runaway requests |
| Roles without `web_search_exa` / `deep_search_exa` | No search spend for those people |
| `deepResearch` only for admins, Quick depth | Fewer long research runs |
| `RESEARCH_MAX_CONCURRENT=1` | One research at a time |
| Exa spending limits in its dashboard | A hard monthly ceiling |

## Sources

Checked 17 November 2026:

- Exa: [official pricing update](https://exa.ai/docs/changelog/pricing-update.md), [pricing reference](https://exa.ai/docs/reference/pricing.md)
- Slack: [free plan limits](https://slack.com/help/articles/27204752526611), [plan prices](https://pumble.com/slack-pricing)
- H100 prices: [Jarvislabs H100 price guide](https://jarvislabs.ai/blog/h100-price), [IntuitionLabs rental comparison](https://intuitionlabs.ai/pdfs/h100-rental-prices-compared-1-49-6-98-hr-across-15-cloud-providers-2026.pdf)
- MI300X prices: [RunPod MI300X](https://www.runpod.io/gpu-models/mi300x), [Thunder Compute MI300X pricing](https://www.thundercompute.com/blog/amd-mi300x-pricing)
- GitHub: [GitHub's plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)

The VM price range and the usage assumptions are estimates, not quotes.
