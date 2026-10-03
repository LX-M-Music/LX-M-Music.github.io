import FeatureIcon from './FeatureIcon';
import styles from './FeatureCard.module.css';

export interface FeatureCardProps {
  icon: 'plugin' | 'cookie' | 'swap' | 'audio' | 'image' | 'motion';
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>
        <FeatureIcon name={icon} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
