// Marketing Team OS — Blueprint Output (document one-pager)
// Renders the full personalized result from a computed blueprint.

const Output = ({ blueprint, onRetake, onJumpToAgent }) => {
  const b = blueprint;
  const role = b.priorityRole;
  const narrative = buildNarrative(b);
  const agents = b.recommendedAgentKeys.map((k) => AGENTS[k]);
  const today = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).toUpperCase();

  // Build personalized "responsibilities" list — use the role's spec
  const resp = [
    `Own ${role.name === "Demand Architect" ? "pipeline mechanics end-to-end" : role.key === "Positioning" ? "the market POV and messaging" : role.key === "Content" ? "the publishing system end-to-end" : "the GTM data and forecast layer"}.`,
    ...role.fourR.Responsibilities.slice(0, 4),
  ];

  // §2 priority-card framing varies by Move type — "Priority hire" only when actually hiring
  const priorityEyebrow =
    b.moveType === "hire" ? "PRIORITY HIRE" : "PRIORITY GAP";
  const priorityCardSub =
    b.moveType === "extend"
      ? `${role.comp.title} · ${b.answers.arr} stage · agent stopgap until ${b.nextArrThreshold}.`
      : b.moveType === "compound"
      ? `${role.comp.title} · ${b.answers.arr} stage · seat is filled — agents compound the role.`
      : `${role.comp.title} · ${b.answers.arr} stage · 90 days to close.`;

  // §3 agent stack copy — Extend frames as stopgap, Compound frames as force multiplier
  const section3Agents = narrative.section3Body
    ? b.recommendedAgentKeys
        .slice(0, narrative.section3Body.agentCount)
        .map((key) => {
          const agent = AGENTS[key];
          const agentRoleObj = ROLES.find((r) => r.agentKey === key);
          const humanRole = agentRoleObj ? agentRoleObj.name : agent.role;
          const second =
            b.moveType === "extend"
              ? `Covers the ${humanRole.toLowerCase()} part of the role until ARR justifies the hire.`
              : `Force multiplier for the ${humanRole.toLowerCase()} who owns this 4R role today.`;
          return { key, name: agent.name, first: agent.purpose, second };
        })
    : [];

  return (
    <div className="output" id="output">
      {/* sticky toolbar */}
      <div className="output-toolbar">
        <div className="container">
          <div className="crumbs">
            <span>YOUR BLUEPRINT</span>
            <span style={{ color: "var(--ee-line-strong)" }}>·</span>
            <span>GENERATED {today}</span>
            <span style={{ color: "var(--ee-line-strong)" }}>·</span>
            <span>PRIORITY: {role.name.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="ghost" size="sm" onClick={onRetake}>↻ Retake</Btn>
            <Btn kind="ghost" size="sm" onClick={() => window.print()}>↓ Save as PDF</Btn>
            <Btn size="sm" onClick={() => scrollToId("book")}>Book a call <ArrowUR /></Btn>
          </div>
        </div>
      </div>

      <div className="output-doc">
        {/* HEADER */}
        <div className="output-header">
          <Eyebrow>MARKETING TEAM BLUEPRINT · v1.0</Eyebrow>
          <h1 className="h1" style={{ marginTop: 12, maxWidth: "22ch" }}>
            A 90-day plan for a {b.answers.arr} {b.answers.motion.toLowerCase()} SaaS.
          </h1>
          <div className="output-meta">
            <span>PREPARED FOR: YOU</span>
            <span className="dot">·</span>
            <span>PREPARED BY: RYAN CARLIN</span>
            <span className="dot">·</span>
            <span>{today}</span>
          </div>
        </div>

        {/* §1 SNAPSHOT */}
        <section className="out-section">
          <div className="out-section-head">
            <span className="num">§01</span>
            <h2 className="h2">Your snapshot</h2>
          </div>
          <div className="body" style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ee-ink)" }}>
            {narrative.snapshot}
          </div>
        </section>

        {/* §2 GAP */}
        <section className="out-section">
          <div className="out-section-head">
            <span className="num">§02</span>
            <h2 className="h2">Your gap</h2>
          </div>
          <div className="priority-card">
            <Eyebrow>{priorityEyebrow} · WEIGHTED GAP {b.gaps[b.priorityKey].toFixed(2)}</Eyebrow>
            <div className="role-name">{role.name}.</div>
            <div className="body">{priorityCardSub}</div>
          </div>
          <div className="body" style={{ fontSize: 16 }}>
            {narrative.gap}
          </div>
        </section>

        {/* §3 — adaptive: Hire (JD + comp + 30/60/90), Extend (agent stopgap), Compound (force multiplier sequence) */}
        <section className="out-section">
          <div className="out-section-head">
            <span className="num">§03</span>
            <h2 className="h2">{narrative.section3Heading}</h2>
          </div>

          {b.moveType === "hire" ? (
            <>
              <table className="fact-table">
                <tbody>
                  <tr>
                    <td className="k">Title</td>
                    <td className="v">{role.comp.title}</td>
                  </tr>
                  <tr>
                    <td className="k">Reports to</td>
                    <td className="v">
                      {b.answers.role.startsWith("Founder")
                        ? "Founder / CEO (until CMO joins at $15M+)"
                        : b.answers.role.includes("VP") || b.answers.role.includes("CMO")
                        ? "VP Marketing / CMO"
                        : "Founder or CMO"}
                    </td>
                  </tr>
                  <tr>
                    <td className="k">Base</td>
                    <td className="v">{role.comp.base}</td>
                  </tr>
                  <tr>
                    <td className="k">OTE</td>
                    <td className="v">{role.comp.ote} · {role.comp.bonus} bonus tied to {role.key === "Demand" ? "pipeline" : role.key === "RevOps" ? "forecast accuracy" : "company-wide targets"}</td>
                  </tr>
                  <tr>
                    <td className="k">Equity</td>
                    <td className="v">{role.comp.equity} · 4yr · 1yr cliff</td>
                  </tr>
                  <tr>
                    <td className="k">Geo adjustment</td>
                    <td className="v">+10–20% NYC / SF / Boston · −10–15% remote-only</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="h3" style={{ marginTop: 32, marginBottom: 12 }}>5 responsibilities</h3>
              <ol className="numbered-list">
                {resp.slice(0, 5).map((r, i) => (<li key={i}>{r}</li>))}
              </ol>

              <h3 className="h3" style={{ marginTop: 32, marginBottom: 12 }}>3 must-haves</h3>
              <ol className="numbered-list">
                {role.fourR.Requirements.map((r, i) => (<li key={i}>{r}</li>))}
              </ol>

              <h3 className="h3" style={{ marginTop: 32, marginBottom: 16 }}>First 30 · 60 · 90</h3>
              <div className="thirty-grid">
                {narrative.ninety.map((s) => (
                  <div key={s.day}>
                    <div className="day">{s.day}</div>
                    <div className="h4" style={{ marginTop: 6, marginBottom: 8 }}>{s.title}</div>
                    <div className="small" style={{ color: "var(--ee-ink-2)", lineHeight: 1.5 }}>{s.body}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="body" style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ee-ink)" }}>
                {narrative.section3Body.lead}
              </div>
              <div className="body" style={{ fontSize: 16, marginTop: 12, color: "var(--ee-ink-2)" }}>
                {narrative.section3Body.bridge}
              </div>

              <div style={{ marginTop: 24 }}>
                {section3Agents.map((a, i) => (
                  <div className="agent-row" key={a.key}>
                    <span className="n">0{i + 1}</span>
                    <div>
                      <div className="h4">{a.name}</div>
                      <div className="small" style={{ marginTop: 4 }}>{a.first}</div>
                      <div className="small" style={{ marginTop: 4, color: "var(--ee-ink-2)" }}>{a.second}</div>
                    </div>
                    <Btn kind="ghost" size="sm" onClick={() => onJumpToAgent(a.key)}>
                      ↓ Jump to spec
                    </Btn>
                  </div>
                ))}
              </div>

              {narrative.section3Body.footer && (
                <div className="body" style={{ fontSize: 15, marginTop: 24, color: "var(--ee-ink-2)", fontStyle: "italic" }}>
                  {narrative.section3Body.footer}
                </div>
              )}
            </>
          )}
        </section>

        {/* §4 AI LEVERAGE */}
        <section className="out-section">
          <div className="out-section-head">
            <span className="num">§04</span>
            <h2 className="h2">Your AI leverage</h2>
          </div>
          <div className="body" style={{ fontSize: 16, marginBottom: 24 }}>
            {narrative.aiCopy}
          </div>

          {/* AI maturity meter */}
          <div className="card mute" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="mono small" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>AI Leverage Score</span>
              <span className="mono small" style={{ color: "var(--ee-ink)" }}>{b.aiLeverage.toFixed(2)} / 1.00</span>
            </div>
            <div style={{ height: 8, background: "var(--ee-bg)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--ee-line)" }}>
              <div style={{ width: Math.round(b.aiLeverage * 100) + "%", height: "100%", background: "var(--ee-blue)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }} className="mono micro">
              <span>NEEDS GROUNDWORK</span>
              <span>READY TO COMPOUND</span>
            </div>
          </div>

          <div>
            {agents.map((agent, i) => (
              <div className="agent-row" key={agent.name}>
                <span className="n">0{i + 1}</span>
                <div>
                  <div className="h4">{agent.name}</div>
                  <div className="small" style={{ marginTop: 4 }}>{agent.fits}</div>
                </div>
                <Btn kind="ghost" size="sm" onClick={() => onJumpToAgent(b.recommendedAgentKeys[i])}>
                  ↓ Jump to spec
                </Btn>
              </div>
            ))}
          </div>
        </section>

        {/* §5 90-DAY */}
        <section className="out-section">
          <div className="out-section-head">
            <span className="num">§05</span>
            <h2 className="h2">Your 90-day path</h2>
          </div>
          <div className="body" style={{ fontSize: 16, marginBottom: 16 }}>
            {b.moveType === "extend"
              ? "Specific, not generic. Pulled from how I'd cover this gap with agents inside your shop today."
              : b.moveType === "compound"
              ? "Specific, not generic. Pulled from how I'd sequence the agent stack on top of your existing team today."
              : "Specific, not generic. Pulled from how I'd run this hire inside your shop today."}
          </div>
          <div className="stack" style={{ gap: 0 }}>
            {narrative.ninety.map((s, i) => (
              <div key={s.day} style={{
                display: "grid", gridTemplateColumns: "100px 1fr",
                gap: 32, padding: "24px 0",
                borderTop: i === 0 ? "1px solid var(--ee-line)" : "1px solid var(--ee-line)",
              }}>
                <div>
                  <div className="mono small" style={{ color: "var(--ee-blue)", letterSpacing: "0.1em" }}>{s.day}</div>
                  <div className="h4" style={{ marginTop: 4 }}>{s.title}</div>
                </div>
                <div className="body" style={{ color: "var(--ee-ink)" }}>{s.body}</div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--ee-line)" }} />
          </div>
        </section>

        {/* CLOSING CTA — copy varies by Move type */}
        <section className="output-cta">
          <Eyebrow onDark>ONE LAST THING</Eyebrow>
          <h2 className="h2" style={{ marginTop: 12, marginBottom: 12, maxWidth: "22ch" }}>
            {narrative.cta.headline}
          </h2>
          <div className="body" style={{ maxWidth: 540, marginBottom: 24 }}>
            {narrative.cta.body}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn size="lg" onClick={() => scrollToId("book")}>
              Book 30 minutes with Ryan <ArrowUR />
            </Btn>
            <Btn kind="ghost" size="lg" onClick={onRetake} className="on-dark">
              ↻ Retake the diagnostic
            </Btn>
          </div>
        </section>
      </div>
    </div>
  );
};

Object.assign(window, { Output });
