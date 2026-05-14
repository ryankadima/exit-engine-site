// Marketing Team OS — 4R Library (role tabs) + Agent Library (agent tabs)
// Two parallel sections, both using the same tab-list pattern.

// ---------------------------------------------------------------
// 4R role library
// ---------------------------------------------------------------
const FourRLibrary = ({ highlightKey, currentArrIdx }) => {
  // Default tab → priority role if we have one, else Demand Architect.
  const initialIdx = React.useMemo(() => {
    if (highlightKey) {
      const i = ROLES.findIndex((r) => r.key === highlightKey);
      if (i >= 0) return i;
    }
    return 1; // Demand
  }, [highlightKey]);

  const [active, setActive] = React.useState(initialIdx);
  React.useEffect(() => { setActive(initialIdx); }, [initialIdx]);

  const role = ROLES[active];
  const stageIdx = typeof currentArrIdx === "number"
    ? (currentArrIdx <= 1 ? 0 : currentArrIdx <= 3 ? 1 : 2)
    : -1;

  return (
    <section id="library" className="section">
      <div className="container">
        <div className="lib-head">
          <SectionNum n="04">THE 4R LIBRARY</SectionNum>
          <h2 className="h2" style={{ maxWidth: "22ch", marginBottom: 12 }}>
            Each role, fully specified.
          </h2>
          <p className="lede">
            JD template, scorecard, 30/60/90, KPIs, compensation, and the
            matching Claude agent. Pick a role.
          </p>
        </div>

        {/* TABS */}
        <div className="lib-tabs" role="tablist">
          {ROLES.map((r, i) => (
            <button
              key={r.key}
              className={"lib-tab" + (i === active ? " active" : "")}
              onClick={() => setActive(i)}
              role="tab"
              aria-selected={i === active}
            >
              <span className="n">№ {r.n}</span>
              <span className="name">{r.name}</span>
              <span className="desc">{r.hook}</span>
            </button>
          ))}
        </div>

        {/* PANEL */}
        <div className="lib-panel">
          {/* role header */}
          <div className="lib-panel-head">
            <div>
              <Eyebrow>№ {role.n} · {role.name.toUpperCase()}</Eyebrow>
              <h3 className="h1" style={{ marginTop: 12, marginBottom: 12, maxWidth: "20ch" }}>
                {role.hook}
              </h3>
              <p className="body" style={{ maxWidth: 600, fontSize: 16 }}>{role.desc}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn kind="ghost" size="sm">⌘ Copy JD</Btn>
              <Btn size="sm">↓ Download full spec</Btn>
            </div>
          </div>

          {/* 4R breakdown */}
          <div className="fourR-grid">
            {["Role", "Responsibilities", "Results", "Requirements"].map((h) => (
              <div className="fourR-col" key={h}>
                <span className="label">{h.toUpperCase()}</span>
                <div className="h4">{
                  h === "Role" ? "What they own" :
                  h === "Responsibilities" ? "Day-to-day" :
                  h === "Results" ? "How you measure" :
                  "What 'good' looks like"
                }</div>
                <ul>
                  {role.fourR[h].map((item) => (<li key={item}>{item}</li>))}
                </ul>
              </div>
            ))}
          </div>

          {/* WHO OWNS BY STAGE */}
          <div className="card" style={{ marginBottom: 24 }}>
            <Eyebrow muted>WHO OWNS THIS BY STAGE</Eyebrow>
            <div className="stage-grid" style={{ marginTop: 16 }}>
              {role.stages.map((s, i) => (
                <div key={s.stage} className={"stage-card" + (i === stageIdx ? " current" : "")}>
                  <div className="stage">{s.stage}</div>
                  <div className="h4" style={{ marginTop: 6 }}>{s.who}</div>
                  {i === stageIdx && <div className="here">← YOU ARE HERE</div>}
                </div>
              ))}
            </div>
          </div>

          {/* COMP + KPI split */}
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div className="card">
              <Eyebrow muted>COMPENSATION · {role.comp.band}</Eyebrow>
              <div className="h4" style={{ marginTop: 8, marginBottom: 16 }}>{role.comp.title}</div>
              <div className="comp-card" style={{ padding: 0, border: 0 }}>
                {[
                  ["BASE", role.comp.base],
                  ["OTE", role.comp.ote],
                  ["BONUS", role.comp.bonus],
                  ["EQUITY", role.comp.equity],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="k">{k}</div>
                    <div className="h3" style={{ fontSize: 20 }}>{v}</div>
                  </div>
                ))}
              </div>
              <p className="small" style={{ marginTop: 16, color: "var(--ee-ink-3)" }}>
                +10–20% NYC / SF / Boston · −10–15% remote-only.
              </p>
            </div>

            <div className="card">
              <Eyebrow muted>KPIs TO TRACK</Eyebrow>
              <div style={{ marginTop: 16 }}>
                {role.kpis.map((k) => (
                  <div key={k.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "12px 0", borderTop: "1px solid var(--ee-line)", alignItems: "center" }}>
                    <span className="h4" style={{ fontSize: 14 }}>{k.name}</span>
                    <span className="mono small" style={{ color: "var(--ee-blue)" }}>{k.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Matching agent strip */}
          <div className="agent-card dark">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ maxWidth: 520 }}>
                <span className="label mono small" style={{ letterSpacing: "0.1em" }}>MATCHING CLAUDE AGENT</span>
                <h3 className="h3" style={{ marginTop: 8, marginBottom: 8 }}>{AGENTS[role.agentKey].name}</h3>
                <p className="body">{AGENTS[role.agentKey].fits}</p>
              </div>
              <Btn onClick={() => scrollToId("agents")}>
                View agent spec <ArrowUR />
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------
// Agent library (parallel tab structure for 4 agents)
// ---------------------------------------------------------------
const AgentLibrary = ({ highlightAgentKey, onDeepLink }) => {
  const keys = Object.keys(AGENTS);
  const initialIdx = React.useMemo(() => {
    if (highlightAgentKey) {
      const i = keys.indexOf(highlightAgentKey);
      if (i >= 0) return i;
    }
    return 0;
  }, [highlightAgentKey]);

  const [active, setActive] = React.useState(initialIdx);
  React.useEffect(() => { setActive(initialIdx); }, [initialIdx]);

  const agentKey = keys[active];
  const agent = AGENTS[agentKey];
  const role = ROLES.find((r) => r.agentKey === agentKey);

  // Replace template variables in prompt with placeholders (or visitor's
  // actual values when we have them down the line).
  const promptText = agent.prompt;

  const [copied, copy] = useCopy();

  return (
    <section id="agents" className="section soft">
      <div className="container">
        <div className="lib-head">
          <SectionNum n="05">CLAUDE AGENT LIBRARY</SectionNum>
          <h2 className="h2" style={{ maxWidth: "22ch", marginBottom: 12 }}>
            Four agents. Deployable today.
          </h2>
          <p className="lede">
            Each agent is a Claude Managed Agent spec — system prompt + MCP
            tools + deployment instructions. Copy, paste, connect, run.
          </p>
        </div>

        {/* TABS */}
        <div className="lib-tabs" style={{ background: "var(--ee-bg)" }} role="tablist">
          {keys.map((k, i) => {
            const a = AGENTS[k];
            return (
              <button
                key={k}
                className={"lib-tab" + (i === active ? " active" : "")}
                onClick={() => setActive(i)}
                role="tab"
                aria-selected={i === active}
              >
                <span className="n">№ 0{i + 1}</span>
                <span className="name">{a.name}</span>
                <span className="desc">{a.purpose}</span>
              </button>
            );
          })}
        </div>

        {/* PANEL */}
        <div className="lib-panel">
          <div className="lib-panel-head">
            <div>
              <Eyebrow>№ 0{active + 1} · {agent.name.toUpperCase()}</Eyebrow>
              <h3 className="h1" style={{ marginTop: 12, marginBottom: 12, maxWidth: "22ch" }}>
                {agent.purpose}
              </h3>
              <p className="body" style={{ maxWidth: 620, fontSize: 16 }}>
                Extends the <strong style={{ color: "var(--ee-ink)" }}>{agent.role}</strong>. {agent.fits}
              </p>
            </div>
            <Btn size="sm" onClick={() => scrollToId("library")}>
              ↑ See the {agent.role} role
            </Btn>
          </div>

          <div className="agent-detail">
            {/* LEFT — prompt block */}
            <div>
              <div className="prompt-toolbar">
                <span className="meta">SYSTEM PROMPT · {promptText.split(/\s+/).length} WORDS</span>
                <button
                  className={"copy-btn" + (copied ? " copied" : "")}
                  onClick={() => copy(promptText)}
                >
                  {copied ? "✓ COPIED" : "⌘ COPY PROMPT"}
                </button>
              </div>
              <pre className="prompt-block">{promptText}</pre>

              <div style={{ marginTop: 20 }}>
                <Eyebrow muted>SETUP · 90 MINUTES</Eyebrow>
                <ol className="numbered-list" style={{ marginTop: 12 }}>
                  <li>Create a Claude Project in your workspace. Name it "{agent.name}".</li>
                  <li>Paste the system prompt above. Replace <code className="mono" style={{ background: "var(--ee-bg-mute)", padding: "1px 4px", borderRadius: 3 }}>&#123;&#123;COMPANY&#125;&#125;</code>, <code className="mono" style={{ background: "var(--ee-bg-mute)", padding: "1px 4px", borderRadius: 3 }}>&#123;&#123;ARR&#125;&#125;</code>, and any other variables with your values.</li>
                  <li>Connect the MCP servers listed to the right.</li>
                  <li>Drop your ICP definition and any reference documents into the project's knowledge base.</li>
                  <li>Run the default cadence prompts from the system spec. Review output with the human role-owner weekly.</li>
                </ol>
              </div>
            </div>

            {/* RIGHT — spec details */}
            <aside className="spec-list">
              <div className="spec-block">
                <span className="label">MCP SERVERS REQUIRED</span>
                <div className="mcp-chips">
                  {agent.mcp.map((m) => (<Chip key={m} kind="fill">{m}</Chip>))}
                </div>
              </div>

              <div className="spec-block">
                <span className="label">INPUTS</span>
                <ul>
                  {agent.inputs.map((i) => (<li key={i}>{i}</li>))}
                </ul>
              </div>

              <div className="spec-block">
                <span className="label">OUTPUTS</span>
                <ul>
                  {agent.outputs.map((o) => (<li key={o}>{o}</li>))}
                </ul>
              </div>

              <div className="spec-block">
                <span className="label">HUMAN ↔ AGENT</span>
                <p className="small" style={{ color: "var(--ee-ink-2)" }}>{agent.fits}</p>
              </div>

              <div className="spec-block" style={{ borderTop: "1px solid var(--ee-line)", paddingTop: 20 }}>
                <span className="label">PAIRED ROLE</span>
                <div className="h4" style={{ marginTop: 6 }}>{agent.role}</div>
                <Btn kind="ghost" size="sm" style={{ marginTop: 10 }} onClick={() => scrollToId("library")}>
                  ↑ See JD & comp <ArrowR />
                </Btn>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};

Object.assign(window, { FourRLibrary, AgentLibrary });
