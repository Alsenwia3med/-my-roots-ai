// SYS-02 · 404 (unknown route). Recover without route diagnostics: Home, Start Assessment, Contact.

import Link from 'next/link';
import styles from './system.module.css';

export default function NotFound() {
  return (
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
  );
}
