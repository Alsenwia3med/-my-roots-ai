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

export default function Roadmap() {
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
        className={"deep"}
        style={{
          position: "relative",
          borderRadius: "40px",
          margin: "0 clamp(8px, 1.2vw, 18px)",
          overflow: "hidden",
          padding: "clamp(64px, 7.4vw, 108px) 0 clamp(64px, 7.4vw, 108px)",
          color: "#FFFFFF",
        }}
      >
        <div className={"mesh"} aria-hidden={"true"}>
          <div
            className={"blob b1"}
            style={{
              left: "-10%",
              top: "-30%",
              width: "50%",
              aspectRatio: "1",
              background: "radial-gradient(circle, rgba(25,167,184,0.6) 0%, rgba(25,167,184,0) 70%)",
            }}
          ></div>{" "}
          <div
            className={"blob b2"}
            style={{
              right: "-8%",
              bottom: "-36%",
              width: "54%",
              aspectRatio: "1",
              background: "radial-gradient(circle, rgba(143,230,234,0.32) 0%, rgba(143,230,234,0) 70%)",
            }}
          ></div>{" "}
          <div
            className={"blob b3"}
            style={{
              left: "38%",
              top: "20%",
              width: "36%",
              aspectRatio: "1",
              background: "radial-gradient(circle, rgba(2,30,36,0.7) 0%, rgba(2,30,36,0) 70%)",
            }}
          ></div>{" "}
          <div
            className={"dotsw"}
            style={{
              WebkitMaskImage: "radial-gradient(70% 60% at 50% 60%, #000 0%, rgba(0,0,0,0) 100%)",
              maskImage: "radial-gradient(70% 60% at 50% 60%, #000 0%, rgba(0,0,0,0) 100%)",
            }}
          ></div>
        </div>{" "}
        <div className={"wrap"} style={{ position: "relative" }}>
          <div className={`rv ${seen.cs ? "seen" : ""}`} data-rv={"cs"} style={{ textAlign: "center" }}>
            <div className={"eb ebd mn"}>
              <span className={"dot"} aria-hidden={"true"} style={{ background: "#8FE6EA" }}></span>
              <span>The Seven Stages of ROOTS-AI™</span>
            </div>{" "}
            <h2 className={"h2 sf gw sheen"} style={{ maxWidth: "980px", margin: "24px auto 0" }}>
              Seven Stages. One Connected Vision of Human Health.
            </h2>{" "}
            <p
              style={{
                maxWidth: "820px",
                margin: "14px auto 0",
                fontSize: "clamp(17px, 1.32vw, 19px)",
                lineHeight: "1.65",
                color: "#D6EEF0",
              }}
            >
              From Understanding Biology Before Disease to Advanced Human Systems Intelligence. Human health
              is not a collection of isolated systems. It is a continuous interaction between biology,
              environment, behavior, and time.
            </p>
          </div>{" "}
          <div
            className={`gb zg ${seen.cz ? "seen" : ""}`}
            data-rv={"cz"}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "clamp(14px, 1.6vw, 24px)",
              marginTop: "clamp(36px, 4.4vw, 64px)",
            }}
          >
            <div className={"zo"} style={{ gridColumn: "1 / span 4", gridRow: "1 / span 2" }}>
              <div
                className={"gl glo fl2"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "340px",
                  borderRadius: "30px",
                  padding: "clamp(24px, 2.4vw, 34px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "28px",
                  color: "#06323B",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "20px",
                    top: "-4px",
                    fontSize: "clamp(100px, 10vw, 156px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(5,85,100,0.07)",
                  }}
                >
                  01
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#055564",
                    }}
                  >
                    STAGE 01
                  </span>
                  <h3
                    className={"sf"}
                    style={{
                      margin: "14px 0 0",
                      fontSize: "clamp(26px, 2.4vw, 36px)",
                      fontWeight: "600",
                      lineHeight: "1.06",
                      color: "#055564",
                    }}
                  >
                    Mini Version Assessment Intelligence
                  </h3>
                  <p style={{ margin: "16px 0 0", fontSize: "15px", lineHeight: "1.6", color: "#2C5963" }}>
                    The foundation of ROOTS-AI™. Structured biological assessments designed to help
                    individuals better understand patterns across interconnected areas of health, supported by
                    evidence-informed, non-diagnostic insights.
                  </p>
                </div>
              </div>
            </div>{" "}
            <div className={"zo"} style={{ gridColumn: "5 / span 4", transitionDelay: "140ms" }}>
              <div
                className={"gd lift"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "164px",
                  borderRadius: "28px",
                  padding: "26px clamp(20px, 2vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "18px",
                    top: "-4px",
                    fontSize: "clamp(84px, 8vw, 124px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(255,255,255,0.08)",
                  }}
                >
                  02
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#8FE6EA",
                    }}
                  >
                    STAGE 02
                  </span>
                  <h3
                    className={"sf"}
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(20px, 1.7vw, 25px)",
                      fontWeight: "600",
                      lineHeight: "1.1",
                      color: "#FFFFFF",
                    }}
                  >
                    Human Systems + Biological Measurement Foundation
                  </h3>
                </div>{" "}
                <p
                  style={{
                    position: "relative",
                    margin: "0",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    color: "#D6EEF0",
                  }}
                >
                  Moving beyond a single assessment toward understanding biological change over time.
                  Connecting personal health information, biological measurements, and longitudinal patterns.
                </p>
              </div>
            </div>{" "}
            <div className={"zo"} style={{ gridColumn: "9 / span 4", transitionDelay: "280ms" }}>
              <div
                className={"gd lift"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "164px",
                  borderRadius: "28px",
                  padding: "26px clamp(20px, 2vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "18px",
                    top: "-4px",
                    fontSize: "clamp(84px, 8vw, 124px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(255,255,255,0.08)",
                  }}
                >
                  03
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#8FE6EA",
                    }}
                  >
                    STAGE 03
                  </span>
                  <h3
                    className={"sf"}
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(20px, 1.7vw, 25px)",
                      fontWeight: "600",
                      lineHeight: "1.1",
                      color: "#FFFFFF",
                    }}
                  >
                    Human System Reconciliation™ v1
                  </h3>
                </div>{" "}
                <p
                  style={{
                    position: "relative",
                    margin: "0",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    color: "#D6EEF0",
                  }}
                >
                  Bringing different dimensions of human biology into a more connected perspective.
                  Integration of advanced biological information, molecular insights, and a governed wellness
                  ecosystem.
                </p>
              </div>
            </div>{" "}
            <div className={"zo"} style={{ gridColumn: "5 / span 4", transitionDelay: "420ms" }}>
              <div
                className={"gd lift"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "164px",
                  borderRadius: "28px",
                  padding: "26px clamp(20px, 2vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "18px",
                    top: "-4px",
                    fontSize: "clamp(84px, 8vw, 124px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(255,255,255,0.08)",
                  }}
                >
                  04
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#8FE6EA",
                    }}
                  >
                    STAGE 04
                  </span>
                  <h3
                    className={"sf"}
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(20px, 1.7vw, 25px)",
                      fontWeight: "600",
                      lineHeight: "1.1",
                      color: "#FFFFFF",
                    }}
                  >
                    Therapeutic &amp; Multimorbidity Intelligence
                  </h3>
                </div>{" "}
                <p
                  style={{
                    position: "relative",
                    margin: "0",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    color: "#D6EEF0",
                  }}
                >
                  Exploring relationships between multiple health conditions, therapeutic approaches, and
                  individual responses while preserving professional clinical judgment.
                </p>
              </div>
            </div>{" "}
            <div className={"zo"} style={{ gridColumn: "9 / span 4", transitionDelay: "560ms" }}>
              <div
                className={"gd lift"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "164px",
                  borderRadius: "28px",
                  padding: "26px clamp(20px, 2vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "18px",
                    top: "-4px",
                    fontSize: "clamp(84px, 8vw, 124px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(255,255,255,0.08)",
                  }}
                >
                  05
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#8FE6EA",
                    }}
                  >
                    STAGE 05
                  </span>
                  <h3
                    className={"sf"}
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(20px, 1.7vw, 25px)",
                      fontWeight: "600",
                      lineHeight: "1.1",
                      color: "#FFFFFF",
                    }}
                  >
                    Cross-Specialty &amp; Clinical Continuity
                  </h3>
                </div>{" "}
                <p
                  style={{
                    position: "relative",
                    margin: "0",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    color: "#D6EEF0",
                  }}
                >
                  Connecting relevant health information across medical specialties for greater continuity,
                  collaboration, and multidisciplinary care.
                </p>
              </div>
            </div>{" "}
            <div className={"zo"} style={{ gridColumn: "1 / span 6", transitionDelay: "700ms" }}>
              <div
                className={"dp lift"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  borderRadius: "30px",
                  padding: "clamp(26px, 2.8vw, 40px) clamp(22px, 3vw, 44px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "24px",
                    top: "-4px",
                    fontSize: "clamp(110px, 12vw, 180px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(255,255,255,0.07)",
                  }}
                >
                  06
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#8FE6EA",
                    }}
                  >
                    STAGE 06
                  </span>
                  <h3
                    className={"sf gw"}
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(26px, 2.6vw, 38px)",
                      fontWeight: "600",
                      lineHeight: "1.05",
                    }}
                  >
                    Hospital-Wide Human System Intelligence
                  </h3>
                </div>{" "}
                <p
                  style={{
                    position: "relative",
                    margin: "0",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "#D6EEF0",
                  }}
                >
                  Extending connected health intelligence across care settings for coordinated information and
                  responsible institutional decision-making.
                </p>
              </div>
            </div>{" "}
            <div className={"zo"} style={{ gridColumn: "7 / span 6", transitionDelay: "840ms" }}>
              <div
                className={"dp lift"}
                style={{
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  borderRadius: "30px",
                  padding: "clamp(26px, 2.8vw, 40px) clamp(22px, 3vw, 44px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <span
                  className={"sf"}
                  aria-hidden={"true"}
                  style={{
                    position: "absolute",
                    right: "24px",
                    top: "-4px",
                    fontSize: "clamp(110px, 12vw, 180px)",
                    fontWeight: "600",
                    lineHeight: "1",
                    color: "rgba(255,255,255,0.07)",
                  }}
                >
                  07
                </span>{" "}
                <div style={{ position: "relative" }}>
                  <span
                    className={"mn"}
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "500",
                      letterSpacing: "0.1em",
                      color: "#8FE6EA",
                    }}
                  >
                    STAGE 07
                  </span>
                  <h3
                    className={"sf gw"}
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(26px, 2.6vw, 38px)",
                      fontWeight: "600",
                      lineHeight: "1.05",
                    }}
                  >
                    Advanced Human System Intelligence
                  </h3>
                </div>{" "}
                <p
                  style={{
                    position: "relative",
                    margin: "0",
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "#D6EEF0",
                  }}
                >
                  Advanced biological modeling and predictive intelligence, supporting earlier understanding
                  and more informed healthcare decisions.
                </p>
              </div>
            </div>
          </div>{" "}
          <div
            className={"rv"}
            style={{ textAlign: "center", maxWidth: "860px", margin: "clamp(36px, 4.4vw, 64px) auto 0" }}
          >
            <h3
              className={"sf gw"}
              style={{
                margin: "0",
                fontSize: "clamp(24px, 2.4vw, 34px)",
                fontWeight: "600",
                lineHeight: "1.15",
              }}
            >
              One Principle Across Every Stage: Governance Is Built Into the Foundation.
            </h3>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: "clamp(17px, 1.32vw, 19px)",
                lineHeight: "1.65",
                color: "#D6EEF0",
              }}
            >
              Assessment Is the Entry Point. Human Systems Intelligence Is the Destination.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
