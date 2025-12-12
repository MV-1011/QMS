import React from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, subtitle, children }) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.titleText}>
          <h1>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
};

export default PageHeader;
