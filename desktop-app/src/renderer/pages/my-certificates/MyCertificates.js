import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import styles from './MyCertificates.module.css';
const MyCertificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    useEffect(() => {
        loadCertificates();
    }, []);
    const loadCertificates = async () => {
        try {
            setLoading(true);
            const response = await apiService.getMyCertificates();
            setCertificates(response.data);
        }
        catch (error) {
            console.error('Failed to load certificates:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDownload = async (id, certificateNumber) => {
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
        }
        catch (error) {
            console.error('Failed to download certificate:', error);
            alert('Failed to download certificate. Please try again.');
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };
    const isExpiringSoon = (expiryDate) => {
        if (!expiryDate)
            return false;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        return expiry.getTime() - now.getTime() < thirtyDays && expiry > now;
    };
    const isExpired = (expiryDate) => {
        if (!expiryDate)
            return false;
        return new Date(expiryDate) < new Date();
    };
    return (_jsxs("div", { className: styles.container, children: [_jsxs("header", { className: styles.header, children: [_jsx("h1", { children: "My Certificates" }), _jsxs("span", { className: styles.count, children: [certificates.length, " certificates"] })] }), loading ? (_jsx("div", { className: styles.loading, children: "Loading certificates..." })) : certificates.length === 0 ? (_jsxs("div", { className: styles.emptyState, children: [_jsx("span", { className: styles.emptyIcon, children: "\uD83C\uDF93" }), _jsx("h3", { children: "No certificates yet" }), _jsx("p", { children: "Complete your trainings and exams to earn certificates." })] })) : (_jsx("div", { className: styles.certificateList, children: certificates.map(cert => (_jsxs("div", { className: `${styles.certificateCard} ${isExpired(cert.expiryDate) ? styles.expired : ''}`, onClick: () => setSelectedCertificate(cert), children: [_jsx("div", { className: styles.certificateIcon, children: "\uD83C\uDF93" }), _jsxs("div", { className: styles.certificateInfo, children: [_jsx("h3", { children: cert.trainingTitle }), _jsxs("p", { className: styles.certNumber, children: ["#", cert.certificateNumber] }), _jsxs("div", { className: styles.certMeta, children: [_jsxs("span", { children: ["Issued: ", formatDate(cert.issueDate)] }), cert.expiryDate && (_jsxs("span", { className: isExpiringSoon(cert.expiryDate) ? styles.expiringSoon : '', children: ["Expires: ", formatDate(cert.expiryDate)] }))] }), cert.examScore && (_jsxs("div", { className: styles.score, children: ["Score: ", cert.examScore, "%"] }))] }), _jsx("div", { className: styles.status, children: isExpired(cert.expiryDate) ? (_jsx("span", { className: styles.statusExpired, children: "Expired" })) : isExpiringSoon(cert.expiryDate) ? (_jsx("span", { className: styles.statusExpiring, children: "Expiring Soon" })) : (_jsx("span", { className: styles.statusValid, children: "Valid" })) })] }, cert._id))) })), selectedCertificate && (_jsx("div", { className: styles.modal, onClick: () => setSelectedCertificate(null), children: _jsxs("div", { className: styles.modalContent, onClick: e => e.stopPropagation(), children: [_jsx("button", { className: styles.closeBtn, onClick: () => setSelectedCertificate(null), children: "\u00D7" }), _jsxs("div", { className: styles.certificatePreview, children: [_jsxs("div", { className: styles.previewHeader, children: [_jsx("div", { className: styles.ribbon, children: "CERTIFICATE" }), _jsx("h2", { children: "Certificate of Completion" })] }), _jsxs("div", { className: styles.previewBody, children: [_jsx("p", { className: styles.presenter, children: "This is to certify that" }), _jsx("h3", { className: styles.recipientName, children: selectedCertificate.userName }), _jsx("p", { className: styles.completion, children: "has successfully completed" }), _jsx("h4", { className: styles.courseName, children: selectedCertificate.trainingTitle }), selectedCertificate.examScore && (_jsxs("p", { className: styles.scoreInfo, children: ["with a score of ", _jsxs("strong", { children: [selectedCertificate.examScore, "%"] })] })), _jsxs("div", { className: styles.dates, children: [_jsxs("div", { children: [_jsx("span", { children: "Date Issued" }), _jsx("strong", { children: formatDate(selectedCertificate.issueDate) })] }), selectedCertificate.expiryDate && (_jsxs("div", { children: [_jsx("span", { children: "Valid Until" }), _jsx("strong", { children: formatDate(selectedCertificate.expiryDate) })] }))] }), _jsxs("div", { className: styles.certFooter, children: [_jsxs("p", { className: styles.certId, children: ["Certificate ID: ", selectedCertificate.certificateNumber] }), _jsxs("p", { className: styles.verifyCode, children: ["Verification Code: ", selectedCertificate.verificationCode] })] })] })] }), _jsx("div", { className: styles.modalActions, children: _jsx("button", { onClick: () => handleDownload(selectedCertificate._id, selectedCertificate.certificateNumber), className: styles.downloadBtn, children: "Download Certificate" }) })] }) }))] }));
};
export default MyCertificates;
