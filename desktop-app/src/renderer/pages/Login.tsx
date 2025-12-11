import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import styles from './Login.module.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Load tenant branding
    if (window.electronAPI) {
      window.electronAPI.getTenantInfo().then((info: any) => {
        if (info) {
          setTenantInfo(info);
          // Apply branding
          if (info.branding?.primaryColor) {
            document.documentElement.style.setProperty(
              '--primary-color',
              info.branding.primaryColor
            );
          }
        }
      });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Background pharmacy/QMS logo */}
      <div className={styles.backgroundLogo}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Pharmacy Cross */}
          <rect x="70" y="20" width="60" height="160" rx="8" fill="white"/>
          <rect x="20" y="70" width="160" height="60" rx="8" fill="white"/>
          {/* Document/Clipboard icon overlay */}
          <rect x="75" y="55" width="50" height="65" rx="4" fill="rgba(102, 126, 234, 0.3)" stroke="white" strokeWidth="2"/>
          <line x1="85" y1="70" x2="115" y2="70" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="85" y1="82" x2="115" y2="82" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="85" y1="94" x2="105" y2="94" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          {/* Checkmark */}
          <circle cx="150" cy="150" r="30" fill="rgba(255,255,255,0.9)"/>
          <path d="M135 150 L145 160 L165 140" stroke="rgba(102, 126, 234, 0.8)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>

      <div className={styles.loginBox}>
        <div className={styles.header}>
          {tenantInfo?.branding?.logo ? (
            <img
              src={tenantInfo.branding.logo}
              alt="Logo"
              className={styles.logo}
            />
          ) : (
            <h1>E-QMS</h1>
          )}
          <h2>{tenantInfo?.branding?.name || 'Pharmacy Quality Management'}</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Version: {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
