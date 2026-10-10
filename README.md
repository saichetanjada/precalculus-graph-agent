# Graph Studio

An AI precalculus teaching agent with an interactive graphing website. Built by Sai Jada.

Students can ask questions, request hints, explore transformations, and ask the tutor to draw functions. The tutor uses validated math tools before returning graph actions to the website.

## Features

- Eleven function families: linear, quadratic, absolute value, square root, cubic, exponential, logarithmic, reciprocal, sine, cosine, and tangent.
- Annotated graphs, intercepts, domain and range, transformations, and worked examples.
- AI explanations, hints, and practice questions with conversation context.
- Agent tools for analytic function analysis, plotting, and evaluating expressions.
- Safe custom-expression parsing and numerical graph sampling.
- SVG graph export and printable study sheets.

## Run locally

Requires Node.js 22 or later.

```bash
npm ci
cp .env.example .env.local
# Add your API key to .env.local
npm start
```

Open http://localhost:3000. Graph exploration works without an API key. AI tutoring requires a valid OpenAI API key with available API credits; a consumer chat subscription does not supply those credits.

## Architecture

The browser sends questions to a Node server. An agent built with the OpenAI Agents SDK chooses math tools, receives their results, and produces an explanation. Plot tools return structured actions that update the graph. The browser never receives the API key. Request tracing is disabled and model requests use store=false. Conversation history stays in browser memory and is sent with subsequent questions; no application database stores it.

The default model is gpt-4.1-mini and can be changed with OPENAI_MODEL. The application has its own branding and does not require the ChatGPT interface.

## Deploy independently

Use the included Dockerfile on a Node/container hosting service. Set these variables in the hosting dashboard, rather than in source control:

- OPENAI_API_KEY: your secret API key.
- APP_ORIGIN: your website's exact HTTPS origin, without a trailing slash.
- TUTOR_ACCESS_CODE: a secret class access code entered by students in the website.
- PORT: provided by most hosting services; defaults to 3000.
- OPENAI_MODEL: optional model override.

Connect your own domain through the hosting service. Health checks can use /health. Do not configure SITES_PRIVATE_DEPLOYMENT outside the optional private Sites deployment. ALLOW_PUBLIC_AI=true deliberately allows AI requests without a class access code; use it only after adding suitable abuse controls and a spending budget.

Rate limits are per process (30 requests per hour and three concurrent requests), so a production service with multiple replicas should use a shared rate-limit store and stronger student authentication. The class code is a lightweight access gate, not an account system.

## Validation

```bash
npm test
npm run smoke
```

Ten tests cover function roots, domain restrictions, expression safety, poles, request validation, access controls, and an actual SDK tool loop with a scripted model. The smoke command additionally makes a paid live model request and requires credits. The current live smoke attempt was blocked by exhausted API credits; a successful live tutoring response is not yet verified.

Numerical custom graphs can miss repeated roots, narrow features, discontinuities, or behavior outside their sampled window. Numerical roots are estimates, and sampled graphs do not prove domain or range. Analytic family tools are more precise. Tutor explanations should be checked against the returned math results.

## Optional Sites build

The worker/ and scripts/build.mjs files support an optional Worker deployment. That build requires an existing .openai/hosting.json project manifest, intentionally excluded from the portable download. Independent Node hosting uses npm start and needs neither that manifest nor the Worker build.

Never commit .env.local or any API key.
