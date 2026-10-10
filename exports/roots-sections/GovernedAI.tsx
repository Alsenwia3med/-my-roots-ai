// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import "./sections.css";

/* Scroll-reveal: elements carrying data-rv="key" get the "seen" class when they enter the viewport. */
function useReveal() {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const k = e.target.getAttribute("data-rv");
          setSeen((p) => ({ ...p, [k]: true }));
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    document.querySelectorAll("[data-rv]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return seen;
}

export default function GovernedAI() {
  const seen = useReveal();
  return (
    <div
      className={"v1 js"}
      style={{
        background: "#FFFFFF",
        color: "#06323B",
        fontFamily: "'Saans', 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "17px",
        lineHeight: "1.55",
      }}
    >
      <section
        className={"pw"}
        style={{ position: "relative", padding: "0 0 clamp(88px, 9.4vw, 136px)", background: "#FFFFFF" }}
      >
        <div className={"wrap"} style={{ position: "relative" }}>
          <div
            className={`g2 rvg ${seen.gv ? "seen" : ""}`}
            data-rv={"gv"}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.78fr) minmax(0, 1.22fr)",
              gap: "32px clamp(24px, 4vw, 64px)",
              alignItems: "center",
            }}
          >
            <div className={"rvi"}>
              <div className={"eb ebl mn"}>
                <span className={"dot"} aria-hidden={"true"} style={{ background: "#19A7B8" }}></span>
                <span>Governed AI Intelligence</span>
              </div>{" "}
              <h2
                className={"sf gt sheen"}
                style={{
                  margin: "22px 0 0",
                  fontSize: "clamp(32px, 3.7vw, 54px)",
                  fontWeight: "600",
                  lineHeight: "1",
                  letterSpacing: "-0.015em",
                  textWrap: "balance",
                }}
              >
                Powerful AI. Governed by Science.
              </h2>{" "}
              <p
                style={{
                  maxWidth: "440px",
                  margin: "14px 0 0",
                  fontSize: "clamp(16px, 1.2vw, 18px)",
                  lineHeight: "1.65",
                  color: "#2C5963",
                }}
              >
                <strong>Not every AI-generated answer deserves to become a health decision.</strong>{" "}
                ROOTS-AI™ combines structured biological intelligence with evidence-aware reasoning,
                traceable decisions, and defined safety boundaries. AI supports understanding. Evidence sets
                the boundaries. Humans retain authority.
              </p>{" "}
              <span
                className={"mn"}
                style={{
                  display: "block",
                  margin: "22px 0 0",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  color: "#055564",
                }}
              >
                FIVE PRINCIPLES. NO SHORTCUTS.
              </span>
            </div>{" "}
            <div
              className={"g3 rvi"}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "clamp(12px, 1.3vw, 18px)",
              }}
            >
              <div
                className={"gl lift"}
                style={{
                  boxSizing: "border-box",
                  borderRadius: "24px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <span className={"mn"} style={{ fontSize: "12px", letterSpacing: "0.1em", color: "#055564" }}>
                  01
                </span>
                <span style={{ fontSize: "16px", lineHeight: "1.3", fontWeight: "600", color: "#06323B" }}>
                  Evidence Has the First Word
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#2C5963" }}>
                  Before AI explains, underlying information must be considered within its scientific context.
                  Plausibility is not proof. Association is not causation.
                </span>
              </div>{" "}
              <div
                className={"gl lift"}
                style={{
                  boxSizing: "border-box",
                  borderRadius: "24px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <span className={"mn"} style={{ fontSize: "12px", letterSpacing: "0.1em", color: "#055564" }}>
                  02
                </span>
                <span style={{ fontSize: "16px", lineHeight: "1.3", fontWeight: "600", color: "#06323B" }}>
                  Uncertainty Is Information
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#2C5963" }}>
                  Missing evidence should not become an invented conclusion. A system that recognizes what it
                  cannot establish is more useful than one that pretends to know everything.
                </span>
              </div>{" "}
              <div
                className={"gl lift"}
                style={{
                  boxSizing: "border-box",
                  borderRadius: "24px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <span className={"mn"} style={{ fontSize: "12px", letterSpacing: "0.1em", color: "#055564" }}>
                  03
                </span>
                <span style={{ fontSize: "16px", lineHeight: "1.3", fontWeight: "600", color: "#06323B" }}>
                  Every Insight Needs a Foundation
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#2C5963" }}>
                  Meaningful interpretations should be traceable to information, evidence, and governed logic
                  supporting them.
                </span>
              </div>{" "}
              <div
                className={"gl lift"}
                style={{
                  boxSizing: "border-box",
                  borderRadius: "24px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <span className={"mn"} style={{ fontSize: "12px", letterSpacing: "0.1em", color: "#055564" }}>
                  04
                </span>
                <span style={{ fontSize: "16px", lineHeight: "1.3", fontWeight: "600", color: "#06323B" }}>
                  Boundaries Are Part of Intelligence
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.5", color: "#2C5963" }}>
                  AI assistance must operate within defined scientific, safety, and clinical limits.
                </span>
              </div>{" "}
              <div
                className={"dp"}
                style={{
                  boxSizing: "border-box",
                  borderRadius: "24px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  color: "#FFFFFF",
                }}
              >
                <span className={"mn"} style={{ fontSize: "12px", letterSpacing: "0.1em", color: "#8FE6EA" }}>
                  05
                </span>
                <span style={{ fontSize: "16px", lineHeight: "1.3", fontWeight: "600" }}>
                  Humans Remain the Authority
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                  AI can help people understand complex information. It cannot replace the responsibility,
                  context, and judgment of qualified healthcare professionals.
                </span>
              </div>
            </div>
          </div>{" "}
          <div style={{ position: "relative", marginTop: "clamp(40px, 4.4vw, 64px)", textAlign: "center" }}>
            <h3
              className={"sf"}
              style={{
                margin: "0 auto",
                maxWidth: "900px",
                fontSize: "clamp(24px, 2.4vw, 34px)",
                fontWeight: "600",
                lineHeight: "1.15",
                color: "#055564",
              }}
            >
              We Are Not Building AI to Replace Clinical Judgment. We Are Building Intelligence That Respects
              It.
            </h3>
            <p
              style={{
                maxWidth: "820px",
                margin: "22px auto 0",
                fontSize: "clamp(17px, 1.32vw, 19px)",
                lineHeight: "1.65",
                color: "#2C5963",
              }}
            >
              <strong>The Future Needs More Than Powerful AI. It Needs Accountable Intelligence.</strong>{" "}
              Evidence before explanation. Uncertainty without disguise. Human authority without compromise.
            </p>
            <p
              className={"mn"}
              style={{ margin: "16px 0 0", fontSize: "13px", letterSpacing: "0.08em", color: "#055564" }}
            >
              ROOTS-AI™ | Medicine Before Symptoms™
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
