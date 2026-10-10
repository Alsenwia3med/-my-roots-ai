import styles from '../admin.module.css';

/** Screen title, purpose line and the access badge shown top-right on every ADM frame. */
export function PageHead({ title, subtitle, access }: { title: string; subtitle: string; access: string }) {
  return (
    <div className={styles.headRow}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <span className={styles.pill}>{access}</span>
    </div>
  );
}

/** Rendered instead of any data when the signed-in role may not open this screen. */
export function PermissionDenied() {
  return (
    <div className={styles.card} role="alert">
      <h1 className={styles.title}>Permission denied</h1>
      <p className={styles.subtitle}>Your role does not include access to this screen. The attempt has been recorded.</p>
    </div>
  );
}
