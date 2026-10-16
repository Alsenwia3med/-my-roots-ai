import { Building2, Mail, MapPin } from 'lucide-react';
import styles from './CompanyOffices.module.css';

/** The company's offices, set out as three quiet cards: the main office in the United States first. */
export default function CompanyOffices() {
  return (
    <section className={styles.offices} aria-label="Company offices">
      <article className={`${styles.card} ${styles.main}`}>
        <p className={styles.label}><Building2 size={14} strokeWidth={1.8} aria-hidden="true" /> Main Office · United States</p>
        <h3 className={styles.name}>ROOTS AI HEALTH SYSTEMS, Inc.</h3>
        <address className={styles.address}>
          <span>1111b S Governors Avenue STE 56726</span>
          <span>Dover, DE 19904-6903</span>
          <span>United States</span>
        </address>
        <a className={styles.mail} href="mailto:info@roots-ai.health">
          <Mail size={15} strokeWidth={1.8} aria-hidden="true" />
          info@roots-ai.health
        </a>
      </article>

      <article className={styles.card}>
        <p className={styles.label}><MapPin size={14} strokeWidth={1.8} aria-hidden="true" /> Dubai · UAE</p>
        <h3 className={styles.name}>Care Tec Medical Trading FZE</h3>
        <address className={styles.address}>
          <span>Dubai</span>
          <span>United Arab Emirates</span>
        </address>
      </article>

      <article className={styles.card}>
        <p className={styles.label}><MapPin size={14} strokeWidth={1.8} aria-hidden="true" /> Kuala Lumpur · Malaysia</p>
        <address className={styles.address}>
          <span>50-1, Block A, KL Traders Square,</span>
          <span>Jalan Gombak, 53000 Kuala Lumpur,</span>
          <span>Malaysia</span>
        </address>
      </article>
    </section>
  );
}
