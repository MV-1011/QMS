import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import apiService from '../../services/api';
import PageHeader from '../../components/PageHeader';
import styles from './MyCertificates.module.css';

interface Certificate {
  _id: string;
  certificateNumber: string;
  trainingTitle: string;
  userName: string;
  issueDate: string;
  expiryDate?: string;
  examScore?: number;
  completionDate: string;
  isValid: boolean;
  verificationCode: string;
  trainingId: {
    title: string;
    category: string;
    trainingType: string;
  };
}

const MyCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyCertificates();
      setCertificates(response.data);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, certificateNumber: string) => {
    try {
      const blob = await apiService.downloadCertificatePDF(id);
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${certificateNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() < thirtyDays && expiry > now;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className={styles.container}>
      <PageHeader icon={<Award size={24} />} title="My Certificates">
        <span className={styles.count}>{certificates.length} certificates</span>
      </PageHeader>

      {loading ? (
        <div className={styles.loading}>Loading certificates...</div>
      ) : certificates.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🎓</span>
          <h3>No certificates yet</h3>
          <p>Complete your trainings and exams to earn certificates.</p>
        </div>
      ) : (
        <div className={styles.certificateList}>
          {certificates.map(cert => (
            <div
              key={cert._id}
              className={`${styles.certificateCard} ${isExpired(cert.expiryDate) ? styles.expired : ''}`}
              onClick={() => setSelectedCertificate(cert)}
            >
              <div className={styles.certificateIcon}>🎓</div>
              <div className={styles.certificateInfo}>
                <h3>{cert.trainingTitle}</h3>
                <p className={styles.certNumber}>#{cert.certificateNumber}</p>
                <div className={styles.certMeta}>
                  <span>Issued: {formatDate(cert.issueDate)}</span>
                  {cert.expiryDate && (
                    <span className={isExpiringSoon(cert.expiryDate) ? styles.expiringSoon : ''}>
                      Expires: {formatDate(cert.expiryDate)}
                    </span>
                  )}
                </div>
                {cert.examScore && (
                  <div className={styles.score}>Score: {cert.examScore}%</div>
                )}
              </div>
              <div className={styles.status}>
                {isExpired(cert.expiryDate) ? (
                  <span className={styles.statusExpired}>Expired</span>
                ) : isExpiringSoon(cert.expiryDate) ? (
                  <span className={styles.statusExpiring}>Expiring Soon</span>
                ) : (
                  <span className={styles.statusValid}>Valid</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div className={styles.modal} onClick={() => setSelectedCertificate(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedCertificate(null)}
            >
              &times;
            </button>

            <div className={styles.certificatePreview}>
              <div className={styles.previewHeader}>
                <div className={styles.ribbon}>CERTIFICATE</div>
                <h2>Certificate of Completion</h2>
              </div>

              <div className={styles.previewBody}>
                <p className={styles.presenter}>This is to certify that</p>
                <h3 className={styles.recipientName}>{selectedCertificate.userName}</h3>
                <p className={styles.completion}>has successfully completed</p>
                <h4 className={styles.courseName}>{selectedCertificate.trainingTitle}</h4>

                {selectedCertificate.examScore && (
                  <p className={styles.scoreInfo}>
                    with a score of <strong>{selectedCertificate.examScore}%</strong>
                  </p>
                )}

                <div className={styles.dates}>
                  <div>
                    <span>Date Issued</span>
                    <strong>{formatDate(selectedCertificate.issueDate)}</strong>
                  </div>
                  {selectedCertificate.expiryDate && (
                    <div>
                      <span>Valid Until</span>
                      <strong>{formatDate(selectedCertificate.expiryDate)}</strong>
                    </div>
                  )}
                </div>

                <div className={styles.certFooter}>
                  <p className={styles.certId}>
                    Certificate ID: {selectedCertificate.certificateNumber}
                  </p>
                  <p className={styles.verifyCode}>
                    Verification Code: {selectedCertificate.verificationCode}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => handleDownload(selectedCertificate._id, selectedCertificate.certificateNumber)}
                className={styles.downloadBtn}
              >
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
