// Global 404 — required because the app has two root layouts ((home) and (site)).
// Mirrors the original SYS-02 screen (Home · Start Assessment · Contact).
import "./(site)/globals.css";
import "./(site)/zd-tokens.css";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./(site)/system.module.css";

export const metadata: Metadata = {
  title: "Page not found | ROOTS-AI™",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main id="main" className={styles.wrap}>
          <div className={styles.card}>
            <p className={styles.code}>404</p>
            <h1 className={styles.title}>Page not found</h1>
            <p className={styles.body}>The page you are looking for is not available.</p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btn}>Home</Link>
              <Link href="/assessment" className={`${styles.btn} ${styles.btnSecondary}`}>Start Assessment</Link>
              <Link href="/contact" className={`${styles.btn} ${styles.btnSecondary}`}>Contact</Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
