// Marketing Team OS — Diagnostic (split-screen with live preview)
// State lives at App level and is passed in via props; this component owns
// only its own question-step + selection cursor.

// ---------------------------------------------------------------
// LivePreview (right pane)
// Shows a document scaffold that progressively fills in as answers land.
// ---------------------------------------------------------------
const LivePreview = ({ answers, complete }) => {
  // Full blueprint only computes when we have enough signal for the
  // gap-weighting + AI-leverage math. Until then the upper blocks fill in
  // from lighter-weight derivations so the preview doesn't stay flat.
  const minViable =
    answers.arr && answers.filled && answers.gap && answers.constraint;
  const blueprint = minViable ? computeBlueprint(answers) : null;
  const narrative = blueprint ? buildNarrative(blueprint) : null;

  // Standalone coverage view — fires as soon as Q4 (filled) is answered,
  // not gated on Q5/Q8 like the full blueprint.
  const earlyCov = React.useMemo(() => {
    if (!answers.filled || answers.filled.length === 0) return null;
    const filled = answers.filled;
    const has = {
      Positioning: filled.some((s) => s.startsWith("Positioning")),
      Demand:      filled.some((s) => s.startsWith("Demand")),
      Content:     filled.some((s) => s.startsWith("Content")),
      RevOps:      filled.some((s) => s.startsWith("Revenue")),
    };
    const noneAtAll = filled.some((s) => s.startsWith("None"));
    const have = [];
    const open = [];
    for (const k of ["Positioning", "Demand", "Content", "RevOps"]) {
      const name = ROLES.find((r) => r.key === k).name;
      if (!noneAtAll && has[k]) have.push(name);
      else open.push(name);
    }
    return { have, open };
  }, [answers.filled]);

  // % filled — drive opacity / completeness of preview blocks
  const answeredCount = QUESTIONS.filter((q) => {
    const v = answers[q.id];
    return q.kind === "check" ? v && v.length > 0 : !!v;
  }).length;
  const pct = answeredCount / QUESTIONS.length;

  const stage = answers.arr || "—";
  const motion = answers.motion || "—";
  const roleNote = answers.role || "—";

  // Use full-blueprint coverage when available; otherwise the early one.
  const cov = blueprint ? coverageSummary(blueprint) : earlyCov;

  return (
    <div className="diag-right">
      <div className="diag-right-head">
        <span className="preview-tag">
          <span className="pulse" />
          {complete ? "BLUEPRINT READY" : "LIVE PREVIEW · BUILDING…"}
        </span>
        <span className="mono micro">UPDATES AS YOU ANSWER</span>
      </div>

      <div className="preview-doc">
        <div className="doc-head">
          <Logo size={14} />
          <span className="mono micro">
            {complete ? "BLUEPRINT · DRAFT v1" : "BLUEPRINT · DRAFTING…"}
          </span>
        </div>

        {/* --- Snapshot block --- */}
        <div className="preview-block">
          <div className="pencil">DRAFTING — YOUR SNAPSHOT</div>
          <h4 className="h4">Your snapshot</h4>
          {answers.arr || answers.role || answers.motion ? (
            <div className="body" style={{ fontSize: 13.5, marginTop: 6 }}>
              {answers.arr && <span><strong style={{ color: "var(--ee-ink)" }}>{answers.arr}</strong> · </span>}
              {answers.role && <span>{answers.role.toLowerCase()} · </span>}
              {answers.motion && <span>{answers.motion.toLowerCase()}</span>}
            </div>
          ) : (
            <>
              <span className="bar long" />
              <span className="bar mid" />
            </>
          )}
        </div>

        {/* --- Coverage block (after Q4) --- */}
        <div className={"preview-block" + (cov ? "" : " dim")}>
          <h4 className="h4">Your coverage</h4>
          {cov ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div>
                <div className="mono micro" style={{ color: "var(--ee-success)" }}>HAVE</div>
                {cov.have.length === 0 ? (
                  <div className="small" style={{ color: "var(--ee-ink-3)", marginTop: 2 }}>—</div>
                ) : (
                  cov.have.map((n) => (
                    <div key={n} className="small" style={{ marginTop: 2 }}>{n}</div>
                  ))
                )}
              </div>
              <div>
                <div className="mono micro" style={{ color: "var(--ee-danger)" }}>OPEN</div>
                {cov.open.length === 0 ? (
                  <div className="small" style={{ color: "var(--ee-ink-3)", marginTop: 2 }}>—</div>
                ) : (
                  cov.open.map((n) => (
                    <div key={n} className="small" style={{ marginTop: 2 }}>{n}</div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <span className="bar long" />
              <span className="bar short" />
            </>
          )}
        </div>

        {/* --- Gap / Priority hire (after Q5+) --- */}
        <div className={"preview-block" + (blueprint && answers.gap ? "" : " dim")}>
          <h4 className="h4">Your gap</h4>
          {blueprint && answers.gap ? (
            <div style={{ marginTop: 6 }}>
              <div className="mono micro" style={{ color: "var(--ee-blue)", marginBottom: 6 }}>
                {blueprint.moveType === "hire" ? "PRIORITY HIRE" : "PRIORITY GAP"}
              </div>
              <div style={{ fontFamily: "var(--ee-font-display)", fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                {blueprint.priorityRole.name}.
              </div>
              <div className="small" style={{ marginTop: 4 }}>
                {blueprint.moveType === "hire"
                  ? `${blueprint.priorityRole.comp.title} · ${blueprint.priorityRole.comp.base}`
                  : blueprint.moveType === "extend"
                  ? `Agent stopgap · revisit at ${blueprint.nextArrThreshold}`
                  : `Seat filled · agents compound the role`}
              </div>
            </div>
          ) : (
            <>
              <span className="bar long" />
              <span className="bar mid" />
            </>
          )}
        </div>

        {/* --- AI leverage (after Q6+) --- */}
        <div className={"preview-block" + (blueprint && answers.ai ? "" : " dim")}>
          <h4 className="h4">Your AI leverage</h4>
          {blueprint && answers.ai ? (
            <div style={{ marginTop: 6 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="mono micro">SCORE</span>
                <div style={{ flex: 1, height: 6, background: "var(--ee-bg-mute)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: Math.round(blueprint.aiLeverage * 100) + "%", height: "100%", background: "var(--ee-blue)", transition: "width 400ms var(--ee-ease)" }} />
                </div>
                <span className="mono micro" style={{ color: "var(--ee-ink)" }}>{blueprint.aiLeverage.toFixed(2)}</span>
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                {blueprint.recommendedAgentKeys.map((k) => AGENTS[k].name).slice(0, 2).join(" · ")}
              </div>
            </div>
          ) : (
            <>
              <span className="bar mid" />
              <span className="bar short" />
            </>
          )}
        </div>

        {/* --- 90-day path (only at completion) --- */}
        <div className={"preview-block" + (complete ? "" : " dim")}>
          <h4 className="h4">Your 90-day path</h4>
          {complete && narrative ? (
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {narrative.ninety.map((step) => (
                <div key={step.day} style={{ borderTop: "1.5px solid var(--ee-ink)", paddingTop: 6 }}>
                  <div className="mono micro" style={{ color: "var(--ee-blue)" }}>{step.day}</div>
                  <div className="h4" style={{ marginTop: 2, fontSize: 13 }}>{step.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <span className="bar long" />
              <span className="bar mid" />
            </>
          )}
        </div>
      </div>

      <div className="diag-right-foot">
        {complete ? (
          <span style={{ color: "var(--ee-success)" }}>
            ↳ DIAGNOSTIC COMPLETE — FULL BLUEPRINT BELOW
          </span>
        ) : (
          <span>↳ {QUESTIONS.length - answeredCount} MORE TO UNLOCK THE FULL BLUEPRINT · {Math.round(pct * 100)}%</span>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Diagnostic — left pane (questions) + right pane (preview)
// ---------------------------------------------------------------
const Diagnostic = ({ answers, setAnswer, step, setStep, onComplete }) => {
  const q = QUESTIONS[step];
  const value = answers[q.id];
  const total = QUESTIONS.length;
  const pct = Math.round(((step) / total) * 100);
  const stepPct = Math.round(((step + (value ? 1 : 0)) / total) * 100);

  const canNext = q.kind === "check" ? (value && value.length > 0) : !!value;
  const isLast = step === total - 1;

  const onSelect = (opt) => {
    if (q.kind === "check") {
      const cur = value || [];
      const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      setAnswer(q.id, next);
    } else {
      setAnswer(q.id, opt);
      // brief delay then advance — feels responsive but not jarring
      setTimeout(() => {
        if (isLast) onComplete();
        else setStep(step + 1);
      }, 220);
    }
  };

  const onPrev = () => { if (step > 0) setStep(step - 1); };
  const onNext = () => {
    if (!canNext) return;
    if (isLast) onComplete();
    else setStep(step + 1);
  };

  // keyboard: Enter to advance
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canNext) onNext();
      if (e.key === "ArrowLeft" && step > 0) onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [canNext, step, value]);

  // Wide questions get 2-column option layout
  const useCols = q.options.length >= 6;

  return (
    <div className="diagnostic">
      {/* LEFT — questions */}
      <div className="diag-left">
        <div className="diag-top">
          <span className="diag-q-num">
            QUESTION {String(step + 1).padStart(2, "0")} OF {String(total).padStart(2, "0")} · {q.label.toUpperCase()}
          </span>
          <div className="progress" style={{ minWidth: 200 }}>
            <span>{stepPct}%</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: stepPct + "%" }} />
            </div>
          </div>
        </div>

        <div className="diag-question">
          <h2 className="h2">{q.title}</h2>
          {q.sub && <p className="diag-sub">{q.sub}</p>}

          <div className={"diag-options" + (useCols ? " cols" : "")}>
            {q.options.map((opt) => {
              const selected = q.kind === "check"
                ? (value || []).includes(opt)
                : value === opt;
              return (
                <button
                  key={opt}
                  className={"opt" + (selected ? " selected" : "")}
                  onClick={() => onSelect(opt)}
                  type="button"
                >
                  <span className={"indicator" + (q.kind === "check" ? " sq" : "")} />
                  <span className="opt-label">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="diag-nav">
          <Btn kind="ghost" size="sm" onClick={onPrev} disabled={step === 0}>
            ← Back
          </Btn>
          <span className="hint">
            {q.kind === "check" ? "↵ MULTI-SELECT · CLICK NEXT WHEN DONE" : "↵ ENTER TO CONTINUE"}
          </span>
          <Btn onClick={onNext} disabled={!canNext}>
            {isLast ? (<>Generate blueprint <ArrowUR /></>) : (<>Next <ArrowUR /></>)}
          </Btn>
        </div>
      </div>

      {/* RIGHT — live preview */}
      <LivePreview answers={answers} complete={false} />
    </div>
  );
};

Object.assign(window, { Diagnostic, LivePreview });
