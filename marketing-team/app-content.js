// Marketing Team OS — content + scoring engine
// Plain JS (not Babel-transformed). Attaches data to window for use in JSX files.

// ---------------------------------------------------------------
// The 8 diagnostic questions
// ---------------------------------------------------------------
const QUESTIONS = [
  {
    id: "arr",
    label: "Current ARR",
    title: "What's your current ARR?",
    sub: "Rough is fine. We use this to set expected coverage.",
    kind: "radio",
    options: ["$0 – 2M", "$2 – 5M", "$5 – 10M", "$10 – 25M", "$25 – 50M", "$50M+"],
  },
  {
    id: "role",
    label: "Your role",
    title: "What's your role?",
    sub: "Calibrates how I write to you.",
    kind: "radio",
    options: [
      "Founder / CEO",
      "VP Marketing",
      "CMO / Head of Marketing",
      "Head of Growth",
      "RevOps Leader",
      "Other",
    ],
  },
  {
    id: "motion",
    label: "Growth motion",
    title: "What's your primary growth motion?",
    sub: "If you blend, pick the one that drives most pipeline.",
    kind: "radio",
    options: [
      "Founder-led sales",
      "Sales-led / AE-driven",
      "Product-led (PLG)",
      "Hybrid PLG + Sales",
      "Channel / Partner-led",
    ],
  },
  {
    id: "filled",
    label: "Roles filled",
    title: "Which 4R roles do you have filled today?",
    sub: "Multi-select. Pick everything that applies.",
    kind: "check",
    options: [
      "Positioning Lead (market POV, messaging, ICP)",
      "Demand Architect (pipeline, channel mix)",
      "Content Engineer (publishing system)",
      "Revenue Operator (GTM tech, attribution)",
      "None — it's me / the founder",
      "Several blended into 1 – 2 people",
    ],
  },
  {
    id: "gap",
    label: "Biggest gap",
    title: "Where do you feel the biggest gap right now?",
    sub: "Pick the one that keeps you up.",
    kind: "radio",
    options: [
      "Positioning Lead",
      "Demand Architect",
      "Content Engineer",
      "Revenue Operator",
    ],
  },
  {
    id: "ai",
    label: "AI maturity",
    title: "How would you rate your AI maturity in GTM today?",
    kind: "radio",
    options: [
      "None — we're exploring",
      "Some prompts and tools, no agents",
      "A few agents or workflows running",
      "AI-native — multiple agents in production",
    ],
  },
  {
    id: "team",
    label: "Team size",
    title: "Marketing team size today?",
    kind: "radio",
    options: ["Just me", "1 – 2 people", "3 – 5 people", "6 – 10 people", "11 – 25 people", "25+ people"],
  },
  {
    id: "constraint",
    label: "Top constraint",
    title: "Top constraint right now?",
    sub: "We'll bias your blueprint around fixing this.",
    kind: "radio",
    options: [
      "Pipeline volume",
      "Pipeline quality / fit",
      "Conversion rates",
      "Forecast accuracy",
      "Brand / category awareness",
      "Content velocity",
      "Hiring the right person",
    ],
  },
];

// ---------------------------------------------------------------
// Constraint → primary role mapping (for weighting)
// ---------------------------------------------------------------
const CONSTRAINT_TO_ROLE = {
  "Pipeline volume": "Demand",
  "Pipeline quality / fit": "Positioning",
  "Conversion rates": "Demand",
  "Forecast accuracy": "RevOps",
  "Brand / category awareness": "Positioning",
  "Content velocity": "Content",
  "Hiring the right person": "Demand",
};

const ROLE_FROM_GAP_LABEL = {
  "Positioning Lead": "Positioning",
  "Demand Architect": "Demand",
  "Content Engineer": "Content",
  "Revenue Operator": "RevOps",
};

const ARR_BAND_INDEX = {
  "$0 – 2M": 0,
  "$2 – 5M": 1,
  "$5 – 10M": 2,
  "$10 – 25M": 3,
  "$25 – 50M": 4,
  "$50M+": 5,
};

// ---------------------------------------------------------------
// Expected coverage matrix per stage
// rows: Positioning, Demand, Content, RevOps
// columns: ARR band 0-5
// values are the expected "who" for that cell + a coverage maturity 0-1
// ---------------------------------------------------------------
const EXPECTED_COVERAGE = {
  Positioning: [
    { who: "Founder", maturity: 0.3 },
    { who: "Founder", maturity: 0.4 },
    { who: "Head of Marketing", maturity: 0.7 },
    { who: "Dedicated PMM", maturity: 0.85 },
    { who: "PMM Team", maturity: 1.0 },
    { who: "PMM Team", maturity: 1.0 },
  ],
  Demand: [
    { who: "Founder", maturity: 0.25 },
    { who: "Generalist / Agency", maturity: 0.45 },
    { who: "Head of Growth", maturity: 0.75 },
    { who: "Demand Leader", maturity: 0.9 },
    { who: "Demand Team", maturity: 1.0 },
    { who: "Demand Team + specialists", maturity: 1.0 },
  ],
  Content: [
    { who: "Founder", maturity: 0.25 },
    { who: "Content Lead", maturity: 0.55 },
    { who: "Content Lead", maturity: 0.7 },
    { who: "Editorial Lead", maturity: 0.85 },
    { who: "Editorial + AI prod", maturity: 1.0 },
    { who: "Editorial team", maturity: 1.0 },
  ],
  RevOps: [
    { who: "Outsourced / None", maturity: 0.1 },
    { who: "Fractional / Outsourced", maturity: 0.3 },
    { who: "Dedicated RevOps", maturity: 0.7 },
    { who: "Head of RevOps", maturity: 0.9 },
    { who: "RevOps Team", maturity: 1.0 },
    { who: "RevOps embedded across GTM", maturity: 1.0 },
  ],
};

// ---------------------------------------------------------------
// 4R roles — content
// ---------------------------------------------------------------
const ROLES = [
  {
    key: "Positioning",
    n: "01",
    name: "Positioning Lead",
    hook: "Owns the market POV.",
    desc: "Messaging, ICP, category narrative, competitive intel. The person who can answer 'why do we win' without looking at notes.",
    fourR: {
      Role: [
        "Owns the message",
        "Owns the ICP definition",
        "Owns the category narrative",
      ],
      Responsibilities: [
        "Win/loss analysis cadence",
        "Sales enablement assets",
        "Competitive battle cards",
        "Quarterly positioning review",
      ],
      Results: [
        "Win rate vs. target accounts",
        "Sales-cycle compression",
        "Message-market fit signal",
      ],
      Requirements: [
        "Senior B2B SaaS PMM background",
        "Ran customer interviews at scale",
        "Comfortable writing in the founder's voice",
      ],
    },
    stages: [
      { stage: "EARLY · $0 – 5M", who: "Founder" },
      { stage: "GROWTH · $5 – 25M", who: "Head of Marketing / PMM Director" },
      { stage: "SCALE · $25M+", who: "VP Product Marketing" },
    ],
    comp: {
      band: "GROWTH STAGE",
      title: "Director / Head of PMM",
      base: "$150 – 200K",
      ote: "$175 – 235K",
      bonus: "15 – 20%",
      equity: "0.1 – 0.4%",
    },
    kpis: [
      { name: "Win rate vs. ICP", target: "+10 pts in 6mo" },
      { name: "Sales cycle length", target: "−20% YoY" },
      { name: "Message-market fit", target: "Quarterly NPS-style signal" },
    ],
    agentKey: "positioning",
  },
  {
    key: "Demand",
    n: "02",
    name: "Demand Architect",
    hook: "Owns the math behind every meeting.",
    desc: "Pipeline mechanics, channel mix, ABM, attribution. The first hire that takes growth off the founder's shoulders.",
    fourR: {
      Role: [
        "Owns pipeline math",
        "Owns channel mix",
        "Owns CAC payback",
      ],
      Responsibilities: [
        "Quarterly channel test program",
        "Paid + ABM + outbound coordination",
        "Pipeline forecast w/ RevOps",
        "Vendor / agency management",
      ],
      Results: [
        "SQO volume / quarter",
        "Channel-level CAC payback",
        "Pipeline forecast accuracy",
      ],
      Requirements: [
        "Ran demand at $5M+ B2B SaaS",
        "Native to HubSpot or Salesforce",
        "Has shipped 50+ paid + ABM experiments",
      ],
    },
    stages: [
      { stage: "EARLY · $0 – 5M", who: "Founder + agency / fractional" },
      { stage: "GROWTH · $5 – 25M", who: "Head of Growth · DIRECT HIRE" },
      { stage: "SCALE · $25M+", who: "VP Demand + paid / ABM specialists" },
    ],
    comp: {
      band: "GROWTH STAGE",
      title: "Head of Growth / Director of Demand Gen",
      base: "$150 – 200K",
      ote: "$180 – 250K",
      bonus: "15 – 20%",
      equity: "0.1 – 0.4%",
    },
    kpis: [
      { name: "SQO volume / quarter", target: "+30% YoY" },
      { name: "CAC payback (blended)", target: "< 18 months" },
      { name: "Channel experiments shipped", target: "≥ 1 / week" },
    ],
    agentKey: "demand",
  },
  {
    key: "Content",
    n: "03",
    name: "Content Engineer",
    hook: "Owns the publishing system.",
    desc: "Signal → draft → distribution → repurpose. Designs the editorial assembly line, then runs it with humans + agents.",
    fourR: {
      Role: [
        "Owns the editorial system",
        "Owns AI workflow design",
        "Owns distribution architecture",
      ],
      Responsibilities: [
        "Weekly editorial calendar",
        "SME interview cadence",
        "Repurposing playbook across formats",
        "Distribution: organic + paid + partners",
      ],
      Results: [
        "Content velocity (assets / week)",
        "Top-of-funnel attributable demand",
        "SEO traffic to ICP keywords",
      ],
      Requirements: [
        "Built a B2B editorial program from scratch",
        "Fluent with Claude / GPT in production",
        "Has shipped 100+ assets with measurable demand",
      ],
    },
    stages: [
      { stage: "EARLY · $0 – 5M", who: "Founder / blended w/ demand" },
      { stage: "GROWTH · $5 – 25M", who: "Head of Content / Editorial Lead" },
      { stage: "SCALE · $25M+", who: "VP Content / Editorial Director" },
    ],
    comp: {
      band: "GROWTH STAGE",
      title: "Head of Content / Editorial Lead",
      base: "$120 – 160K",
      ote: "$130 – 180K",
      bonus: "10 – 15%",
      equity: "0.1 – 0.3%",
    },
    kpis: [
      { name: "Asset velocity", target: "≥ 3 / week, sustained" },
      { name: "Attributed demand", target: "20%+ of MQLs" },
      { name: "Editorial NPS (sales)", target: "Quarterly review" },
    ],
    agentKey: "content",
  },
  {
    key: "RevOps",
    n: "04",
    name: "Revenue Operator",
    hook: "Owns the data layer.",
    desc: "GTM tech, attribution, forecasting, agent orchestration. The person who turns chaos into a forecast you can take to a board.",
    fourR: {
      Role: [
        "Owns CRM / MAP",
        "Owns attribution model",
        "Owns the forecast",
      ],
      Responsibilities: [
        "Pipeline hygiene cadence",
        "Stage definitions + enforcement",
        "Attribution model maintenance",
        "Agent orchestration across GTM",
      ],
      Results: [
        "Forecast accuracy",
        "Stage conversion rates",
        "Time-to-insight",
      ],
      Requirements: [
        "Lived in HubSpot or Salesforce",
        "Can write SQL / dbt-level transforms",
        "Has stood up attribution at a series A/B",
      ],
    },
    stages: [
      { stage: "EARLY · $0 – 5M", who: "Fractional / Outsourced" },
      { stage: "GROWTH · $5 – 25M", who: "Director / Head of RevOps" },
      { stage: "SCALE · $25M+", who: "VP RevOps + embedded RevOps" },
    ],
    comp: {
      band: "GROWTH STAGE",
      title: "Director / Head of RevOps",
      base: "$140 – 200K",
      ote: "$170 – 235K",
      bonus: "10 – 20%",
      equity: "0.1 – 0.4%",
    },
    kpis: [
      { name: "Forecast accuracy", target: "±10% by quarter" },
      { name: "Stage conversion", target: "Trend up, all stages" },
      { name: "Pipeline hygiene score", target: "≥ 95% complete data" },
    ],
    agentKey: "revops",
  },
];

// ---------------------------------------------------------------
// Claude agent specs (one per role)
// ---------------------------------------------------------------
const AGENTS = {
  positioning: {
    name: "Positioning Agent",
    role: "Positioning Lead",
    purpose: "ICP refinement and message-market fit detection from win/loss data.",
    inputs: ["Closed-won/lost CRM data", "Customer interview transcripts", "Prospect data"],
    outputs: ["ICP scoring against live pipeline", "Messaging gap analysis", "Competitive positioning briefs"],
    mcp: ["HubSpot", "Salesforce", "Google Drive", "Web Search"],
    fits: "Owns ICP scoring and message-market fit signal between weekly review cadences with the human Positioning Lead.",
    prompt: `You are the Positioning Agent for {{COMPANY}}, a {{ARR}} B2B SaaS company. You serve {{ROLE}} — work as an extension of the Positioning Lead, not a replacement.

Your scope:
- Score the live pipeline against the ICP definition stored in this project's knowledge.
- Mine closed-won and closed-lost CRM records for messaging signal. Surface 3-5 sharp themes per week.
- Maintain a competitive positioning brief per primary competitor; refresh when new data arrives.

Operating constraints:
- Humans own the ICP definition. You propose refinements; you never overwrite.
- Always cite specific deal IDs and quoted language when you make a claim.
- If you don't have evidence, say so. Do not invent customer voice.

Default cadence:
- Weekly: top-of-pipeline ICP score, top 3 messaging signals.
- Monthly: competitive positioning refresh, win/loss synthesis.
- On-demand: positioning briefs for new launches.

Output format: short, scannable, opinion-first. Lead with the conclusion. Sales reps and the founder are the readers.`,
  },
  demand: {
    name: "Demand Agent",
    role: "Demand Architect",
    purpose: "Signal intelligence and channel efficiency analysis.",
    inputs: ["ICP definition", "Signal sources (hiring, funding, tech intent)", "CRM data"],
    outputs: ["Prioritized account lists with play recommendations", "Channel performance summaries", "CAC payback views"],
    mcp: ["HubSpot", "Salesforce", "Web Search", "Clay / Apollo (optional)"],
    fits: "Stands up as a stopgap before the Demand Architect hire. Becomes an extension once the role is filled.",
    prompt: `You are the Demand Agent for {{COMPANY}}, a {{ARR}} {{MOTION}} B2B SaaS company. You serve the Demand Architect — or stand in for one until that hire lands.

Your scope:
- Identify high-fit accounts every Monday using signal: hiring posts, funding events, tech adoption changes, executive moves.
- Score channel performance weekly: paid, ABM, outbound, content distribution.
- Maintain a rolling CAC payback view by channel. Flag channels trending past 18 months.

Operating constraints:
- Humans approve every outbound play before it touches a prospect.
- You never send email or LinkedIn DMs directly. Your output is a brief; a human ships it.
- Cite the specific signal that triggered each account recommendation.

Default cadence:
- Monday: 25 top accounts + recommended play per account.
- Friday: channel performance digest + experiment recommendations.
- Monthly: CAC payback review + channel mix proposal.

Output format: tabular for accounts, narrative for channel review. Lead with the spend that's wasted.`,
  },
  content: {
    name: "Content Agent",
    role: "Content Engineer",
    purpose: "Editorial production from signals + SME input, with a distribution architecture.",
    inputs: ["Editorial calendar", "SME interview transcripts", "Customer pain themes from CRM"],
    outputs: ["Content drafts", "Distribution briefs", "Repurposing plans across formats"],
    mcp: ["Google Drive", "Notion", "HubSpot", "Web Search"],
    fits: "4x the output of a single Content Engineer without sacrificing voice. Designed for human-final-approval.",
    prompt: `You are the Content Agent for {{COMPANY}}. You serve the Content Engineer and produce drafts in the founder's voice.

Your scope:
- Take a topic + SME interview transcript and produce a 1200-1500 word draft in 2 hours, not 2 weeks.
- Output a distribution brief alongside every draft: 1 LinkedIn post, 1 X thread, 1 newsletter section, 1 sales-enablement one-pager.
- Maintain the editorial calendar. Flag stale topics; surface candidates from CRM pain themes.

Operating constraints:
- Humans approve every draft before it ships. Your draft is a starting point, not the final.
- Use voice samples stored in this project for tone. If you're outside voice, say so up front.
- Never fabricate customer quotes. Use what's in the transcript or in CRM, attributed.

Default cadence:
- Per draft: target 2-hour turnaround from brief to first-pass draft.
- Weekly: editorial calendar review + topic surfacing.
- Monthly: format-mix audit + repurposing recommendations.

Output format: markdown draft + distribution brief table + 1-paragraph voice-check note.`,
  },
  revops: {
    name: "RevOps Agent",
    role: "Revenue Operator",
    purpose: "Pipeline hygiene, forecast accuracy, and deal risk flagging.",
    inputs: ["Pipeline data", "Deal stages", "Activity data (email / calendar)"],
    outputs: ["Hygiene reports", "Forecast roll-ups", "Deal risk flags", "Stage conversion analytics"],
    mcp: ["HubSpot", "Salesforce", "Gmail", "Calendar"],
    fits: "Runs as the connective tissue between sales and marketing data. Always-on; humans review weekly.",
    prompt: `You are the RevOps Agent for {{COMPANY}}, a {{ARR}} B2B SaaS company. You serve the Revenue Operator — or stand in for one until that hire lands.

Your scope:
- Run a daily pipeline hygiene pass. Flag deals with missing data, stage violations, or stale activity.
- Maintain a rolling forecast by stage + rep. Flag deals at risk of slipping at least 14 days before they slip.
- Produce a stage conversion report weekly: where deals stall, by segment + by rep.

Operating constraints:
- Humans own the forecast number that goes to the board. You produce the input.
- Never edit deal data without human approval. You flag; humans fix.
- Cite specific deal IDs in every report.

Default cadence:
- Daily: hygiene digest, top 5 issues.
- Weekly: forecast roll-up + at-risk deal list.
- Monthly: stage conversion deep-dive + rep coaching surfaces.

Output format: short digest at the top, tabular detail below, deal IDs always present.`,
  },
};

// ---------------------------------------------------------------
// Move type classifier — Hire / Extend / Compound
// ---------------------------------------------------------------
// Compound: all four 4R roles filled AND ARR ≥ $25M AND AI ≥ "some prompts and tools"
// Hire:     clear coverage gap AND ARR ≥ $5M AND AI ≤ "few agents running"
// Extend:   ARR < $5M OR AI maturity is "none / exploring"
// Default:  Extend at early stages, Hire at growth, Compound at scale.
function classifyMoveType(answers, actualCoverage, arrIdx) {
  const allFilled = ["Positioning", "Demand", "Content", "RevOps"]
    .every((k) => actualCoverage[k] >= 0.7);
  const aiQuestion = QUESTIONS.find((q) => q.id === "ai");
  const maturityIdx = aiQuestion.options.indexOf(answers.ai);

  if (allFilled && arrIdx >= 4 && maturityIdx >= 1) return "compound";
  if (arrIdx <= 1 || maturityIdx <= 0) return "extend";
  if (!allFilled && arrIdx >= 2 && maturityIdx <= 2) return "hire";

  if (arrIdx >= 4) return "compound";
  if (arrIdx >= 2) return "hire";
  return "extend";
}

// Next $5M ARR threshold above the visitor's current band — used in Extend revisit copy
function nextArrThresholdLabel(arrIdx) {
  const tops = [2, 5, 10, 25, 50, 100];
  const top = tops[arrIdx] ?? 100;
  return `$${Math.ceil((top + 1) / 5) * 5}M ARR`;
}

// ---------------------------------------------------------------
// Scoring engine
// Returns: { priorityRole, priorityRoleKey, aiLeverage, coverage,
//            expectedCoverage, gaps, moveType, narrative inputs }
// ---------------------------------------------------------------
function computeBlueprint(answers) {
  // Default-safe lookups
  const arrIdx = ARR_BAND_INDEX[answers.arr] ?? 2;

  // Map filled checkboxes → which roles are "covered"
  const filled = answers.filled || [];
  const has = {
    Positioning: filled.some((s) => s.startsWith("Positioning")),
    Demand: filled.some((s) => s.startsWith("Demand")),
    Content: filled.some((s) => s.startsWith("Content")),
    RevOps: filled.some((s) => s.startsWith("Revenue")),
  };
  // "Blended into 1-2 people" → partial coverage credit across all
  const blended = filled.some((s) => s.startsWith("Several"));
  const noneAtAll = filled.some((s) => s.startsWith("None"));

  const actualCoverage = {};
  for (const k of ["Positioning", "Demand", "Content", "RevOps"]) {
    if (noneAtAll) actualCoverage[k] = 0.15;
    else if (has[k]) actualCoverage[k] = 0.9;
    else if (blended) actualCoverage[k] = 0.45;
    else actualCoverage[k] = 0.1;
  }

  // Expected coverage at the visitor's stage
  const expected = {};
  for (const k of ["Positioning", "Demand", "Content", "RevOps"]) {
    expected[k] = EXPECTED_COVERAGE[k][arrIdx];
  }

  // Compute gap = expected.maturity - actual; weight by gap-stated and constraint-mapped
  const gapStated = ROLE_FROM_GAP_LABEL[answers.gap];
  const constraintRole = CONSTRAINT_TO_ROLE[answers.constraint];

  const gaps = {};
  for (const k of ["Positioning", "Demand", "Content", "RevOps"]) {
    let raw = Math.max(0, expected[k].maturity - actualCoverage[k]);
    // Boost weight if user stated this is the gap (+0.25)
    if (k === gapStated) raw += 0.25;
    // Boost weight if constraint maps to this role (+0.18)
    if (k === constraintRole) raw += 0.18;
    gaps[k] = Math.min(1, raw);
  }

  // Priority role = highest weighted gap
  const ordered = Object.entries(gaps).sort((a, b) => b[1] - a[1]);
  const priorityKey = ordered[0][0];
  const priorityRoleObj = ROLES.find((r) => r.key === priorityKey);

  // AI Leverage Score = f(AI maturity, team size)
  // Maturity index 0..3, team index 0..5. Low maturity + small team → higher leverage needed.
  const maturityIdx = QUESTIONS[5].options.indexOf(answers.ai);
  const teamIdx = QUESTIONS[6].options.indexOf(answers.team);
  // Score: higher = more leverage available right now (more agents to deploy now vs. later)
  const aiLeverage = Math.max(
    0.1,
    Math.min(1, 0.35 + (maturityIdx * 0.18) + (teamIdx >= 2 ? 0.12 : 0))
  );

  // Recommended agents — full priority-ordered list (renderer slices by Move type)
  const recommendedAgentKeys = ordered
    .map(([k]) => ROLES.find((r) => r.key === k).agentKey)
    .slice(0, 4);

  const moveType = classifyMoveType(answers, actualCoverage, arrIdx);
  const nextArrThreshold = nextArrThresholdLabel(arrIdx);

  return {
    answers,
    priorityKey,
    priorityRole: priorityRoleObj,
    actualCoverage,
    expectedCoverage: expected,
    gaps,
    aiLeverage,
    recommendedAgentKeys,
    constraintRole,
    gapStated,
    blended,
    noneAtAll,
    arrIdx,
    moveType,
    nextArrThreshold,
  };
}

// ---------------------------------------------------------------
// Narrative builders — turn the computed scores into copy
// (Deterministic templating — high-quality, on-voice, no LLM round-trip required.)
// ---------------------------------------------------------------
function buildNarrative(b) {
  const a = b.answers;
  const role = b.priorityRole;
  const arr = a.arr;
  const motion = (a.motion || "").toLowerCase();
  const constraint = (a.constraint || "").toLowerCase();
  const youAre = a.role || "operator";

  // SNAPSHOT
  const coveredRoles = Object.entries(b.actualCoverage)
    .filter(([, v]) => v >= 0.7)
    .map(([k]) => ROLES.find((r) => r.key === k).name);
  const coveredCopy =
    coveredRoles.length === 0
      ? "Nothing in the 4R model is properly covered yet — that's normal at this stage."
      : coveredRoles.length === 1
      ? `You've got ${coveredRoles[0]} covered.`
      : `You've got ${coveredRoles.slice(0, -1).join(", ")} and ${coveredRoles.slice(-1)} covered.`;

  const stageCopy =
    b.arrIdx <= 1
      ? "You're pre-scale — most of the 4R model still routes through you."
      : b.arrIdx === 2
      ? "You're in the most common shape at $5–10M: founder still doing the heavy lifting on strategy, a handful of operators carrying execution."
      : b.arrIdx === 3
      ? "You're past the founder-as-marketing-team threshold. Now it's about specialists and operating cadence."
      : "You're at scale. The work shifts from filling roles to coordinating them.";

  const snapshot = `${stageCopy} ${coveredCopy} The shape of the gap below — and what to do about it — is what most $${arr.replace(/^\$\s*/, "").replace(/\s+/g, "")} founder-led shops get wrong.`;

  // GAP
  const constraintSent =
    constraint && b.constraintRole
      ? `Your top constraint says ${constraint}. That's a ${role.name} problem, not a content problem — and it's why this role tops the gap list.`
      : `Your stated gap is ${role.name}, and the math agrees.`;
  const gap = `${constraintSent} You're at expected-coverage ${Math.round(b.expectedCoverage[b.priorityKey].maturity * 100)}% for ${role.name} at $${arr.replace(/^\$\s*/, "").replace(/\s+/g, "")}, and your actual coverage is ${Math.round(b.actualCoverage[b.priorityKey] * 100)}%. That delta is what's costing you.`;

  // §3 — heading + adaptive body
  const section3Heading =
    b.moveType === "extend" ? "Your AI extension"
    : b.moveType === "compound" ? "Your force multiplier"
    : "Your next hire";

  const arrLabel = arr.replace(/^\$\s*/, "").replace(/\s+/g, "");
  let section3Body = null;
  if (b.moveType === "extend") {
    section3Body = {
      lead: `You're not yet at the stage where a dedicated ${role.name} hire makes sense at $${arrLabel} — and that's the right call.`,
      bridge: `Until you can justify a hire, here's the AI stack that covers this gap.`,
      agentCount: 3,
      footer: `Revisit this diagnostic at ${b.nextArrThreshold} to reassess whether to hire.`,
    };
  } else if (b.moveType === "compound") {
    section3Body = {
      lead: `Your team is configured appropriately for your stage. The leverage at $${arrLabel} isn't in new hires — it's in agent deployment on top of your existing structure.`,
      bridge: `Here's the priority sequence to deploy, starting with the agent that solves your top constraint — framed as a force multiplier for the human who currently owns each 4R role.`,
      agentCount: 4,
      footer: null,
    };
  }

  // §4 — AI Leverage intro line (varies by Move type)
  const aiCopy =
    b.moveType === "extend"
      ? "Beyond the stopgap above, here's the full agent stack to layer in over time."
      : b.moveType === "compound"
      ? "Here's the full deployment sequence for your team."
      : "Beyond your next hire, here's the full agent stack to plan toward.";

  // CTA — copy varies by Move type
  const cta =
    b.moveType === "extend"
      ? { headline: "Want help deploying these agents while you scale?",
          body: "I've stood up this exact stack inside 4 companies — Claude Agents that cover the gap until ARR justifies the hire. 30 minutes is enough to know if it's a fit." }
    : b.moveType === "compound"
      ? { headline: "Want help architecting the full agent stack for your team?",
          body: "I've architected the agent stack inside 4 companies — sequenced for teams that already have the humans in place. 30 minutes is enough to know if it's a fit." }
    : { headline: `Want help hiring your ${role.name}?`,
        body: "I've run this hire inside 4 companies — including the agent stack that ships day-one with the new role. 30 minutes is enough to know if it's a fit." };

  // 90-DAY
  const ninety = buildNinetyDayPlan(b);

  return { snapshot, gap, aiCopy, ninety, coveredCopy, section3Heading, section3Body, cta };
}

function buildNinetyDayPlan(b) {
  const role = b.priorityRole;
  const priorityAgent = AGENTS[role.agentKey].name;
  const secondKey = b.recommendedAgentKeys[1];
  const secondAgent = secondKey ? AGENTS[secondKey].name : "the next agent on the list";
  const nextGapRole =
    ROLES.find((r) => r.key !== b.priorityKey && b.gaps[r.key] > 0.4)?.name || "RevOps";

  if (b.moveType === "extend") {
    return [
      {
        day: "DAY 30",
        title: "Deploy priority agent",
        body: `Stand up the ${priorityAgent} this week against your ${(b.answers.constraint || "top constraint").toLowerCase()} problem. No hire yet — you're proving the gap is covered before you spend on headcount.`,
      },
      {
        day: "DAY 60",
        title: "Layer + monitor",
        body: `Deploy the ${secondAgent}. Watch what the two agents cover cleanly and where they break down. The break-down points are your future hire's job description.`,
      },
      {
        day: "DAY 90",
        title: "Evaluate hiring readiness",
        body: `Decide: does the agent stack hold until ${b.nextArrThreshold}, or does a hire need to come sooner? Re-run this diagnostic with the data you've collected to answer.`,
      },
    ];
  }

  if (b.moveType === "compound") {
    return [
      {
        day: "DAY 30",
        title: "Priority agent live",
        body: `Deploy the ${priorityAgent} for your top constraint (${(b.answers.constraint || "—").toLowerCase()}). Pair it to the human who owns ${role.name} today — agent reports to person, not to you.`,
      },
      {
        day: "DAY 60",
        title: "Layer + integrate",
        body: `Stand up the ${secondAgent}. Wire both into existing team workflows — Slack, CRM, weekly ops review. Force multiplier, not parallel track.`,
      },
      {
        day: "DAY 90",
        title: "Full stack operational",
        body: `Agents running across all four 4R roles, each owned by the human in seat. You're now measuring throughput per role, not headcount per role.`,
      },
    ];
  }

  // Hire mode (default)
  return [
    {
      day: "DAY 30",
      title: "Scope + draft + interview",
      body: `Scope the ${role.name} role, draft the JD off the template in the library, brief 2 search partners or post 1 senior network. Final-round candidates start landing this month.`,
    },
    {
      day: "DAY 60",
      title: "Hire + deploy in parallel",
      body: `Make the hire. Deploy the ${priorityAgent} the same week so it's running by the time the new hire starts. Attribution stitched. Forecast cadence in place.`,
    },
    {
      day: "DAY 90",
      title: "Onboard onto the stack",
      body: `New hire owns the ${priorityAgent} from day one — the stack ships with the role. You re-route to the next gap: ${nextGapRole}.`,
    },
  ];
}

// Helper for live preview — list "covered" / "open" labels with current state
function coverageSummary(b) {
  const have = Object.entries(b.actualCoverage)
    .filter(([, v]) => v >= 0.7)
    .map(([k]) => ROLES.find((r) => r.key === k).name);
  const open = Object.entries(b.actualCoverage)
    .filter(([, v]) => v < 0.7)
    .map(([k]) => ROLES.find((r) => r.key === k).name);
  return { have, open };
}

// Expose to all babel files
Object.assign(window, {
  QUESTIONS,
  ROLES,
  AGENTS,
  CONSTRAINT_TO_ROLE,
  ROLE_FROM_GAP_LABEL,
  EXPECTED_COVERAGE,
  computeBlueprint,
  buildNarrative,
  coverageSummary,
});
