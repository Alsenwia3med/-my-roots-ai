import type { Metadata } from "next";
import "./footer-brand.css";
import BrandFooter from "@/components/lux/FooterBrand";
import { VARIANTS } from "@/components/lux/footer-brand-variants";

export const metadata: Metadata = { title: "Footer concepts — ROOTS-AI™", robots: { index: false } };

export default function FooterLab() {
  return (
    <main id="main" className="fvlab">
      <header className="fvlab-head">
        <h1>Footer Concepts</h1>
        <p dir="rtl">10 تصاميم على طراز المثال. كلها ساكنة وتتفاعل فقط مع مرور الماوس.</p>
      </header>
      {VARIANTS.map((v) => (
        <section key={v.id} className="fvlab-item">
          <div className="fvlab-label">
            <strong>{v.name}</strong>
            <span dir="rtl">{v.desc}</span>
          </div>
          <BrandFooter variant={v.id} />
        </section>
      ))}
    </main>
  );
}
