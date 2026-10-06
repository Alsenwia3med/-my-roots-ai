import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { DOMAIN_LABELS, DOMAIN_TIE_ORDER } from "@/lib/canonical/source";
import { AI_DISCLOSURE, rankedDriverCopy } from "@/lib/canonical/reportContent";
import type { CanonicalReport } from "@/lib/canonical/report";

const styles = StyleSheet.create({
  page: { padding: 36, paddingBottom: 58, fontFamily: "Helvetica", fontSize: 9, color: "#0F5C6A", lineHeight: 1.45 },
  cover: { minHeight: 690, justifyContent: "center", alignItems: "center", textAlign: "center" },
  wordmark: { fontSize: 12, letterSpacing: 2, color: "#28A0A5", marginBottom: 28 },
  title: { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 18 },
  boundary: { fontSize: 11, color: "#6b7280", marginTop: 28 },
  metadata: { marginBottom: 18, padding: 12, backgroundColor: "#f1f4f7", borderRadius: 5 },
  metadataText: { fontSize: 8, color: "#52657d" },
  section: { marginBottom: 15, paddingBottom: 10, borderBottom: "1 solid #d9e1eb" },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 5 },
  sectionNumber: { color: "#28A0A5", fontSize: 8, marginBottom: 3 },
  body: { fontSize: 9, color: "#334b6d" },
  reduced: { fontSize: 8, color: "#6b7280", marginTop: 4 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  metric: { width: "48%", padding: 10, backgroundColor: "#0F5C6A", color: "#ffffff", borderRadius: 5 },
  metricLabel: { fontSize: 7, color: "#b9c7da", textTransform: "uppercase" },
  metricValue: { fontFamily: "Helvetica-Bold", fontSize: 17, marginTop: 3 },
  domain: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "1 solid #edf0f4" },
  domainLabel: { fontSize: 8 },
  domainValue: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  limitation: { marginBottom: 4, color: "#6b7280", fontSize: 8 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, paddingTop: 6, borderTop: "1 solid #d9e1eb", flexDirection: "row", justifyContent: "space-between", color: "#6b7280", fontSize: 7 },
});

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

export function ReportPdf({ report }: { report: CanonicalReport }) {
  const { scoring } = report;
  return <Document title="ROOTS Biological Intelligence Report" author="ROOTS AI HEALTH SYSTEMS, Inc." subject="Educational biological intelligence report">
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.cover}>
        <Text style={styles.wordmark}>ROOTS-AI™</Text>
        <Text style={styles.title}>ROOTS Biological Intelligence Report™</Text>
        <Text>{report.participant_display}</Text>
        <Text>Report ID: {report.report_id}</Text>
        <Text>Generated: {report.generated_at}</Text>
        <Text>Report template: {report.report_template_version}</Text>
        <Text style={styles.boundary}>Educational — Not a Diagnosis</Text>
      </View>
      <View style={styles.metadata} break>
        <Text style={styles.metadataText}>Questionnaire: {report.questionnaire_version}</Text>
        <Text style={styles.metadataText}>Scoring: {report.scoring_version}</Text>
        <Text style={styles.metadataText}>Content hash: {report.contentHash}</Text>
        <Text style={styles.metadataText}>AI provenance: {report.provenance.ai ? (report.provenance.ai.usedFallback ? `governed fallback (${report.provenance.ai.fallbackVersion})` : `${report.provenance.ai.provider} / ${report.provenance.ai.model}`) : "disabled"}</Text>
        <Text style={styles.metadataText}>{AI_DISCLOSURE}</Text>
      </View>
      <View style={styles.metrics}>
        <Metric label="Biological State" value={scoring.biologicalState === null ? "Not Available" : `${scoring.biologicalState}/100`} />
        <Metric label="Opportunity" value={scoring.opportunity === null ? "Not Available" : `${scoring.opportunity.toFixed(1)}/100`} />
        <Metric label="Recovery Potential" value={scoring.recoveryPotential === null ? "Not Available" : `${scoring.recoveryPotential.toFixed(1)}/100`} />
        <Metric label="Confidence" value={`${scoring.confidence}/100 · ${scoring.confidenceLabel}`} />
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Deterministic seven-domain values</Text>{DOMAIN_TIE_ORDER.map((id) => <View style={styles.domain} key={id}><Text style={styles.domainLabel}>{DOMAIN_LABELS[id]}</Text><Text style={styles.domainValue}>{scoring.domains[id] === null ? "Not enough information" : `${scoring.domains[id]}/100`}</Text></View>)}</View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Key Drivers</Text><Text style={styles.body}>{rankedDriverCopy(scoring.drivers)}</Text></View>
      {report.limitations.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Limitations</Text>{report.limitations.map((limitation, index) => <Text style={styles.limitation} key={`${limitation.code}-${index}`}>• {limitation.message}</Text>)}</View>}
      {report.sections.map((section) => <View style={styles.section} key={section.index} break={section.index === 1 || section.index === 10}><Text style={styles.sectionNumber}>{String(section.index).padStart(2, "0")}</Text><Text style={styles.sectionTitle}>{section.title}</Text><Text style={styles.body}>{section.narrative ?? "Not Available"}</Text>{section.reduced && section.reducedReason ? <Text style={styles.reduced}>Reduced state: {section.reducedReason}</Text> : null}</View>)}
      <View style={styles.footer} fixed><Text>ROOTS-AI™ · Report {report.report_id}</Text><Text>Educational — Not a Diagnosis · {report.report_template_version}</Text></View>
    </Page>
  </Document>;
}
