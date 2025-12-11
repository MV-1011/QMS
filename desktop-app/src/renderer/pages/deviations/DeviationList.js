import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import styles from './DeviationList.module.css';
const initialFormData = {
    title: '',
    description: '',
    category: 'Environmental',
    severity: 'Minor',
    occurrenceDate: new Date().toISOString().split('T')[0],
    productAffected: '',
    batchNumber: '',
    immediateAction: '',
};
const CATEGORIES = [
    'Environmental',
    'Equipment',
    'Documentation',
    'Labeling',
    'Inventory',
    'Compounding',
    'Dispensing Error',
    'Training',
    'Water System',
    'Facility',
    'Supply Chain',
    'Other',
];
const DeviationList = () => {
    const [deviations, setDeviations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDev, setSelectedDev] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        loadDeviations();
    }, [statusFilter, severityFilter]);
    const loadDeviations = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter)
                params.status = statusFilter;
            if (severityFilter)
                params.severity = severityFilter;
            const response = await apiService.getDeviations(params);
            setDeviations(response.data || []);
            setError('');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load deviations');
            console.error('Error loading deviations:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleView = (dev) => {
        setSelectedDev(dev);
    };
    const handleCloseDetails = () => {
        setSelectedDev(null);
    };
    const handleCreate = () => {
        setFormData(initialFormData);
        setEditingId(null);
        setShowForm(true);
    };
    const handleEdit = (dev) => {
        setFormData({
            title: dev.title,
            description: dev.description,
            category: dev.category,
            severity: dev.severity,
            occurrenceDate: dev.occurrenceDate ? dev.occurrenceDate.split('T')[0] : '',
            productAffected: dev.productAffected || '',
            batchNumber: dev.batchNumber || '',
            immediateAction: dev.immediateAction || '',
        });
        setEditingId(dev._id);
        setShowForm(true);
        setSelectedDev(null);
    };
    const handleCloseForm = () => {
        setShowForm(false);
        setFormData(initialFormData);
        setEditingId(null);
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (editingId) {
                await apiService.updateDeviation(editingId, formData);
            }
            else {
                await apiService.createDeviation(formData);
            }
            handleCloseForm();
            loadDeviations();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save deviation');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this deviation?'))
            return;
        try {
            await apiService.deleteDeviation(id);
            loadDeviations();
            if (selectedDev?._id === id) {
                setSelectedDev(null);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete deviation');
        }
    };
    const handleStatusChange = async (dev, newStatus) => {
        try {
            await apiService.updateDeviation(dev._id, { status: newStatus });
            loadDeviations();
            if (selectedDev?._id === dev._id) {
                setSelectedDev({ ...selectedDev, status: newStatus });
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'closed':
                return styles.badgeClosed;
            case 'open':
                return styles.badgeOpen;
            case 'investigation':
                return styles.badgeInvestigation;
            case 'capa_required':
            case 'capa_in_progress':
                return styles.badgeCapa;
            case 'pending_closure':
                return styles.badgePending;
            case 'rejected':
                return styles.badgeRejected;
            default:
                return '';
        }
    };
    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'Critical':
                return styles.severityCritical;
            case 'Major':
                return styles.severityMajor;
            case 'Minor':
                return styles.severityMinor;
            default:
                return '';
        }
    };
    const filteredDeviations = deviations.filter((dev) => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (dev.title.toLowerCase().includes(term) ||
                dev.deviationNumber.toLowerCase().includes(term) ||
                dev.category.toLowerCase().includes(term));
        }
        return true;
    });
    // Form view
    if (showForm) {
        return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.detailsHeader, children: [_jsx("button", { className: styles.backBtn, onClick: handleCloseForm, children: "\u2190 Back to List" }), _jsx("h2", { children: editingId ? 'Edit Deviation' : 'Report New Deviation' })] }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "title", children: "Title *" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleInputChange, required: true, placeholder: "Brief description of the deviation" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "description", children: "Detailed Description *" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, required: true, rows: 4, placeholder: "Provide a detailed description of what happened" })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "category", children: "Category *" }), _jsx("select", { id: "category", name: "category", value: formData.category, onChange: handleInputChange, required: true, children: CATEGORIES.map(cat => (_jsx("option", { value: cat, children: cat }, cat))) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "severity", children: "Severity *" }), _jsxs("select", { id: "severity", name: "severity", value: formData.severity, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "Minor", children: "Minor" }), _jsx("option", { value: "Major", children: "Major" }), _jsx("option", { value: "Critical", children: "Critical" })] })] })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "occurrenceDate", children: "Date of Occurrence *" }), _jsx("input", { type: "date", id: "occurrenceDate", name: "occurrenceDate", value: formData.occurrenceDate, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "batchNumber", children: "Batch/Lot Number" }), _jsx("input", { type: "text", id: "batchNumber", name: "batchNumber", value: formData.batchNumber, onChange: handleInputChange, placeholder: "If applicable" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "productAffected", children: "Product(s) Affected" }), _jsx("input", { type: "text", id: "productAffected", name: "productAffected", value: formData.productAffected, onChange: handleInputChange, placeholder: "List any products affected by this deviation" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "immediateAction", children: "Immediate Action Taken" }), _jsx("textarea", { id: "immediateAction", name: "immediateAction", value: formData.immediateAction, onChange: handleInputChange, rows: 3, placeholder: "Describe any immediate actions taken to address the deviation" })] }), error && _jsx("div", { className: styles.error, children: error }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { type: "button", className: styles.btnSecondary, onClick: handleCloseForm, children: "Cancel" }), _jsx("button", { type: "submit", className: styles.btnPrimary, disabled: submitting, children: submitting ? 'Saving...' : (editingId ? 'Update' : 'Report Deviation') })] })] })] }));
    }
    // Detail view
    if (selectedDev) {
        return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.detailsHeader, children: [_jsx("button", { className: styles.backBtn, onClick: handleCloseDetails, children: "\u2190 Back to List" }), _jsx("h2", { children: selectedDev.deviationNumber }), _jsxs("div", { className: styles.detailsActions, children: [_jsx("button", { className: styles.btnSecondary, onClick: () => handleEdit(selectedDev), children: "Edit" }), _jsx("button", { className: styles.btnDanger, onClick: () => handleDelete(selectedDev._id), children: "Delete" })] })] }), _jsxs("div", { className: styles.detailsCard, children: [_jsxs("div", { className: styles.detailsSection, children: [_jsx("h3", { children: selectedDev.title }), _jsxs("div", { className: styles.badges, children: [_jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(selectedDev.status)}`, children: selectedDev.status.replace('_', ' ') }), _jsx("span", { className: `${styles.badge} ${getSeverityBadgeClass(selectedDev.severity)}`, children: selectedDev.severity }), _jsx("span", { className: styles.categoryBadge, children: selectedDev.category })] })] }), _jsxs("div", { className: styles.detailsSection, children: [_jsx("h4", { children: "Description" }), _jsx("p", { children: selectedDev.description })] }), selectedDev.immediateAction && (_jsxs("div", { className: styles.detailsSection, children: [_jsx("h4", { children: "Immediate Action Taken" }), _jsx("p", { children: selectedDev.immediateAction })] })), selectedDev.investigation && (_jsxs("div", { className: styles.detailsSection, children: [_jsx("h4", { children: "Investigation" }), _jsx("p", { children: selectedDev.investigation })] })), selectedDev.rootCause && (_jsxs("div", { className: styles.detailsSection, children: [_jsx("h4", { children: "Root Cause" }), _jsx("p", { children: selectedDev.rootCause })] })), _jsxs("div", { className: styles.detailsGrid, children: [_jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Occurrence Date:" }), _jsx("span", { children: new Date(selectedDev.occurrenceDate).toLocaleDateString() })] }), _jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Detected By:" }), _jsx("span", { children: selectedDev.detectedBy
                                                ? `${selectedDev.detectedBy.firstName} ${selectedDev.detectedBy.lastName}`
                                                : 'N/A' })] }), selectedDev.assignedTo && (_jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Assigned To:" }), _jsx("span", { children: `${selectedDev.assignedTo.firstName} ${selectedDev.assignedTo.lastName}` })] })), selectedDev.productAffected && (_jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Product Affected:" }), _jsx("span", { children: selectedDev.productAffected })] })), selectedDev.batchNumber && (_jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Batch Number:" }), _jsx("span", { children: selectedDev.batchNumber })] })), _jsxs("div", { className: styles.detailsItem, children: [_jsx("label", { children: "Created:" }), _jsx("span", { children: new Date(selectedDev.createdAt).toLocaleDateString() })] })] }), _jsxs("div", { className: styles.statusSection, children: [_jsx("h4", { children: "Update Status" }), _jsx("div", { className: styles.statusButtons, children: ['open', 'investigation', 'capa_required', 'capa_in_progress', 'pending_closure', 'closed'].map(status => (_jsx("button", { className: `${styles.statusBtn} ${selectedDev.status === status ? styles.statusBtnActive : ''}`, onClick: () => handleStatusChange(selectedDev, status), disabled: selectedDev.status === status, children: status.replace('_', ' ') }, status))) })] })] })] }));
    }
    // List view
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { className: styles.headerLeft, children: [_jsx("h2", { children: "Deviations" }), _jsx("p", { className: styles.subtitle, children: "Track and investigate quality deviations and non-conformances" })] }), _jsx("button", { className: styles.btnPrimary, onClick: handleCreate, children: "+ Report Deviation" })] }), _jsxs("div", { className: styles.filters, children: [_jsx("div", { className: styles.searchBox, children: _jsx("input", { type: "text", placeholder: "Search deviations...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: styles.searchInput }) }), _jsxs("select", { value: severityFilter, onChange: (e) => setSeverityFilter(e.target.value), className: styles.filterSelect, children: [_jsx("option", { value: "", children: "All Severities" }), _jsx("option", { value: "Minor", children: "Minor" }), _jsx("option", { value: "Major", children: "Major" }), _jsx("option", { value: "Critical", children: "Critical" })] }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: styles.filterSelect, children: [_jsx("option", { value: "", children: "All Status" }), _jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "investigation", children: "Investigation" }), _jsx("option", { value: "capa_required", children: "CAPA Required" }), _jsx("option", { value: "capa_in_progress", children: "CAPA In Progress" }), _jsx("option", { value: "pending_closure", children: "Pending Closure" }), _jsx("option", { value: "closed", children: "Closed" })] })] }), error && _jsx("div", { className: styles.error, children: error }), loading ? (_jsx("div", { className: styles.loading, children: "Loading deviations..." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: deviations.length }), _jsx("span", { className: styles.statLabel, children: "Total Deviations" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: deviations.filter((d) => d.status === 'open' || d.status === 'investigation').length }), _jsx("span", { className: styles.statLabel, children: "Under Investigation" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: deviations.filter((d) => d.severity === 'Critical').length }), _jsx("span", { className: styles.statLabel, children: "Critical" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("span", { className: styles.statNumber, children: deviations.filter((d) => d.status === 'closed').length }), _jsx("span", { className: styles.statLabel, children: "Closed" })] })] }), filteredDeviations.length === 0 ? (_jsxs("div", { className: styles.empty, children: [_jsx("p", { children: "No deviations found" }), _jsx("button", { className: styles.btnPrimary, onClick: handleCreate, children: "Report your first deviation" })] })) : (_jsx("div", { className: styles.tableContainer, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Deviation #" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Severity" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Detected By" }), _jsx("th", { children: "Occurrence Date" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: filteredDeviations.map((dev) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("button", { className: styles.linkBtn, onClick: () => handleView(dev), children: dev.deviationNumber }) }), _jsx("td", { className: styles.titleCell, children: dev.title }), _jsx("td", { children: dev.category }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getSeverityBadgeClass(dev.severity)}`, children: dev.severity }) }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(dev.status)}`, children: dev.status.replace('_', ' ') }) }), _jsx("td", { children: dev.detectedBy
                                                    ? `${dev.detectedBy.firstName} ${dev.detectedBy.lastName}`
                                                    : 'N/A' }), _jsx("td", { children: new Date(dev.occurrenceDate).toLocaleDateString() }), _jsx("td", { children: _jsxs("div", { className: styles.actions, children: [_jsx("button", { className: styles.btnAction, onClick: () => handleView(dev), title: "View", children: "\uD83D\uDC41\uFE0F" }), _jsx("button", { className: styles.btnAction, onClick: () => handleEdit(dev), title: "Edit", children: "\u270F\uFE0F" }), _jsx("button", { className: styles.btnAction, onClick: () => handleDelete(dev._id), title: "Delete", children: "\uD83D\uDDD1\uFE0F" })] }) })] }, dev._id))) })] }) }))] }))] }));
};
export default DeviationList;
