import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights",
  description: "Educational insights about biology, behaviour and responsible health technology from ROOTS-AI.",
};

export default function BlogPage() {
  return <main className="marketing-page inner-page blog-page">
    <section className="page-heading"><p className="marketing-kicker">ROOTS / INSIGHTS</p><h1>Medicine Before Symptoms™ — Insights</h1><p>Educational articles about metabolism, hunger, sleep, circadian biology, stress, behaviour and responsible health technology.</p></section>
    <section className="blog-editorial">
      <p>Every article displays author, review date, sources and educational disclaimer.</p>
      <p>No article is personalized medical advice.</p>
    </section>
    <section className="blog-launch-state"><h2>Our first evidence-informed insights are being prepared. Please return soon.</h2></section>
  </main>;
}
