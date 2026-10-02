import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './SectionHeader.module.css';

export default function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      <Heading as="h2" className={styles.title}>
        {title}
      </Heading>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
