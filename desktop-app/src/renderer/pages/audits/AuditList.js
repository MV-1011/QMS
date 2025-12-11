import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import styles from './AuditList.module.css';
const initialFormData = {
    title: '',
    description: '',
    auditType: 'Internal',
    scope: '',
    standard: '',
    priority: 'Medium',
    scheduledDate: '',
    auditee: '',
    externalOrganization: '',
    auditorName: '',
};
const AUDIT_TYPES = [
    'Internal',
    'External',
    'Regulatory',
    'Supplier',
    'Self-Inspection',
];
const AuditList = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [auditTypeFilter, setAuditTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    useEffect(() => {
        loadAudits();
    }, [statusFilter, auditTypeFilter, priorityFilter]);
    const loadAudits = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all')
                params.status = statusFilter;
            if (auditTypeFilter !== 'all')
                params.auditType = auditTypeFilter;
            if (priorityFilter !== 'all')
                params.priority = priorityFilter;
            const response = await apiService.getAudits(params);
            setAudits(response.data || []);
            setError(null);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load audits');
            console.error('Error loading audits:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreate = () => {
        setFormData(initialFormData);
        setEditingId(null);
        setShowForm(true);
    };
    const handleEdit = (audit) => {
        setFormData({
            title: audit.title,
            description: audit.description,
            auditType: audit.auditType,
            scope: audit.scope,
            standard: audit.standard || '',
            priority: audit.priority,
            scheduledDate: audit.scheduledDate ? audit.scheduledDate.split('T')[0] : '',
            auditee: audit.auditee || '',
            externalOrganization: audit.externalOrganization || '',
            auditorName: audit.auditorName || '',
        });
        setEditingId(audit._id);
        setShowForm(true);
        setSelectedAudit(null);
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
        setError(null);
        try {
            if (editingId) {
                await apiService.updateAudit(editingId, formData);
            }
            else {
                await apiService.createAudit(formData);
            }
            handleCloseForm();
            loadAudits();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save audit');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this audit?'))
            return;
        try {
            await apiService.deleteAudit(id);
            loadAudits();
            if (selectedAudit?._id === id) {
                setSelectedAudit(null);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete audit');
        }
    };
    const handleStatusChange = async (audit, newStatus) => {
        try {
            await apiService.updateAudit(audit._id, { status: newStatus });
            loadAudits();
            if (selectedAudit?._id === audit._id) {
                setSelectedAudit({ ...selectedAudit, status: newStatus });
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };
    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'Critical':
                return styles.priorityCritical;
            case 'High':
                return styles.priorityHigh;
            case 'Medium':
                return styles.priorityMedium;
            case 'Low':
                return styles.priorityLow;
            default:
                return '';
        }
    };
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'planned':
                return styles.statusPlanned;
            case 'in_progress':
                return styles.statusInProgress;
            case 'report_draft':
                return styles.statusDraft;
            case 'report_review':
                return styles.statusReview;
            case 'completed':
                return styles.statusCompleted;
            case 'closed':
                return styles.statusClosed;
            default:
                return '';
        }
    };
    const getAuditTypeBadgeClass = (type) => {
        switch (type) {
            case 'Internal':
                return styles.typeInternal;
            case 'External':
                return styles.typeExternal;
            case 'Regulatory':
                return styles.typeRegulatory;
            case 'Supplier':
                return styles.typeSupplier;
            case 'Self-Inspection':
                return styles.typeSelfInspection;
            default:
                return '';
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };
    const getStats = () => {
        const total = audits.length;
        const upcoming = audits.filter((a) => a.status === 'planned' && new Date(a.scheduledDate) > new Date()).length;
        const inProgress = audits.filter((a) => a.status === 'in_progress').length;
        const completed = audits.filter((a) => a.status === 'completed' || a.status === 'closed')
            .length;
        return { total, upcoming, inProgress, completed };
    };
    const getTotalFindings = (audit) => {
        if (!audit.findingsCount)
            return 0;
        const { critical, major, minor, observation } = audit.findingsCount;
        return critical + major + minor + observation;
    };
    const stats = getStats();
    // Form view
    if (showForm) {
        return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.detailHeader, children: [_jsx("button", { className: styles.backBtn, onClick: handleCloseForm, children: "\u2190 Back to List" }), _jsx("h2", { children: editingId ? 'Edit Audit' : 'New Audit' })] }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "title", children: "Title *" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleInputChange, required: true, placeholder: "Audit title" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "description", children: "Description *" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, required: true, rows: 3, placeholder: "Describe the purpose and objectives of this audit" })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "auditType", children: "Audit Type *" }), _jsx("select", { id: "auditType", name: "auditType", value: formData.auditType, onChange: handleInputChange, required: true, children: AUDIT_TYPES.map(type => (_jsx("option", { value: type, children: type }, type))) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "priority", children: "Priority *" }), _jsxs("select", { id: "priority", name: "priority", value: formData.priority, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "scope", children: "Scope *" }), _jsx("textarea", { id: "scope", name: "scope", value: formData.scope, onChange: handleInputChange, required: true, rows: 2, placeholder: "Define the scope of the audit" })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "standard", children: "Standard/Regulation" }), _jsx("input", { type: "text", id: "standard", name: "standard", value: formData.standard, onChange: handleInputChange, placeholder: "e.g., ISO 9001, FDA 21 CFR Part 11" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "scheduledDate", children: "Scheduled Date *" }), _jsx("input", { type: "date", id: "scheduledDate", name: "scheduledDate", value: formData.scheduledDate, onChange: handleInputChange, required: true })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "auditee", children: "Auditee (Department/Area)" }), _jsx("input", { type: "text", id: "auditee", name: "auditee", value: formData.auditee, onChange: handleInputChange, placeholder: "e.g., Quality Control, Production" })] }), (formData.auditType === 'External' || formData.auditType === 'Regulatory') && (_jsxs(_Fragment, { children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "externalOrganization", children: "External Organization" }), _jsx("input", { type: "text", id: "externalOrganization", name: "externalOrganization", value: formData.externalOrganization, onChange: handleInputChange, placeholder: "Name of external auditing organization" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "auditorName", children: "External Auditor Name" }), _jsx("input", { type: "text", id: "auditorName", name: "auditorName", value: formData.auditorName, onChange: handleInputChange, placeholder: "Name of external auditor" })] })] })), error && _jsx("div", { className: styles.error, children: error }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { type: "button", className: styles.secondaryBtn, onClick: handleCloseForm, children: "Cancel" }), _jsx("button", { type: "submit", className: styles.primaryBtn, disabled: submitting, children: submitting ? 'Saving...' : (editingId ? 'Update' : 'Create Audit') })] })] })] }));
    }
    if (loading) {
        return (_jsx("div", { className: styles.container, children: _jsx("div", { className: styles.loading, children: "Loading audits..." }) }));
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { children: [_jsx("h1", { children: "Audit Management" }), _jsx("p", { className: styles.subtitle, children: "Internal, External, Regulatory, and Supplier Audits" })] }), _jsx("div", { className: styles.headerActions, children: _jsx("button", { className: styles.primaryBtn, onClick: handleCreate, children: "+ New Audit" }) })] }), error && _jsx("div", { className: styles.error, children: error }), _jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "Total Audits" }), _jsx("div", { className: styles.statValue, children: stats.total })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "Upcoming" }), _jsx("div", { className: styles.statValue, children: stats.upcoming })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "In Progress" }), _jsx("div", { className: styles.statValue, children: stats.inProgress })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "Completed" }), _jsx("div", { className: styles.statValue, children: stats.completed })] })] }), _jsxs("div", { className: styles.filters, children: [_jsxs("div", { className: styles.filterGroup, children: [_jsx("label", { children: "Status:" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "planned", children: "Planned" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "report_draft", children: "Report Draft" }), _jsx("option", { value: "report_review", children: "Report Review" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "closed", children: "Closed" })] })] }), _jsxs("div", { className: styles.filterGroup, children: [_jsx("label", { children: "Audit Type:" }), _jsxs("select", { value: auditTypeFilter, onChange: (e) => setAuditTypeFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "Internal", children: "Internal" }), _jsx("option", { value: "External", children: "External" }), _jsx("option", { value: "Regulatory", children: "Regulatory" }), _jsx("option", { value: "Supplier", children: "Supplier" }), _jsx("option", { value: "Self-Inspection", children: "Self-Inspection" })] })] }), _jsxs("div", { className: styles.filterGroup, children: [_jsx("label", { children: "Priority:" }), _jsxs("select", { value: priorityFilter, onChange: (e) => setPriorityFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "Critical", children: "Critical" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "Low", children: "Low" })] })] })] }), _jsx("div", { className: styles.content, children: !selectedAudit ? (_jsxs("div", { className: styles.listView, children: [_jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Audit #" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Priority" }), _jsx("th", { children: "Scheduled Date" }), _jsx("th", { children: "Auditee" }), _jsx("th", { children: "Findings" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: audits.map((audit) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: audit.auditNumber }) }), _jsx("td", { className: styles.titleCell, children: audit.title }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getAuditTypeBadgeClass(audit.auditType)}`, children: audit.auditType }) }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(audit.status)}`, children: audit.status.replace(/_/g, ' ') }) }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getPriorityBadgeClass(audit.priority)}`, children: audit.priority }) }), _jsx("td", { children: formatDate(audit.scheduledDate) }), _jsx("td", { children: audit.auditee || 'N/A' }), _jsx("td", { children: audit.findingsCount ? (_jsx("span", { className: styles.findingsCount, children: getTotalFindings(audit) })) : ('-') }), _jsx("td", { children: _jsxs("div", { className: styles.actionBtns, children: [_jsx("button", { className: styles.viewBtn, onClick: () => setSelectedAudit(audit), children: "\uD83D\uDC41\uFE0F" }), _jsx("button", { className: styles.viewBtn, onClick: () => handleEdit(audit), children: "\u270F\uFE0F" }), _jsx("button", { className: styles.viewBtn, onClick: () => handleDelete(audit._id), children: "\uD83D\uDDD1\uFE0F" })] }) })] }, audit._id))) })] }), audits.length === 0 && (_jsxs("div", { className: styles.emptyState, children: [_jsx("p", { children: "No audits found" }), _jsx("button", { className: styles.primaryBtn, onClick: handleCreate, children: "Schedule your first audit" })] }))] })) : (_jsxs("div", { className: styles.detailView, children: [_jsxs("div", { className: styles.detailHeader, children: [_jsx("button", { className: styles.backBtn, onClick: () => setSelectedAudit(null), children: "\u2190 Back to List" }), _jsxs("div", { className: styles.detailActions, children: [_jsx("button", { className: styles.editBtn, onClick: () => handleEdit(selectedAudit), children: "Edit" }), _jsx("button", { className: styles.deleteBtn, onClick: () => handleDelete(selectedAudit._id), children: "Delete" })] })] }), _jsxs("div", { className: styles.detailContent, children: [_jsxs("div", { className: styles.detailSection, children: [_jsxs("h2", { children: [selectedAudit.auditNumber, " - ", selectedAudit.title] }), _jsxs("div", { className: styles.detailBadges, children: [_jsx("span", { className: `${styles.badge} ${getAuditTypeBadgeClass(selectedAudit.auditType)}`, children: selectedAudit.auditType }), _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(selectedAudit.status)}`, children: selectedAudit.status.replace(/_/g, ' ') }), _jsx("span", { className: `${styles.badge} ${getPriorityBadgeClass(selectedAudit.priority)}`, children: selectedAudit.priority })] })] }), _jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Description" }), _jsx("p", { children: selectedAudit.description })] }), _jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Audit Details" }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Scope:" }), _jsx("span", { children: selectedAudit.scope })] }), selectedAudit.standard && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Standard:" }), _jsx("span", { children: selectedAudit.standard })] })), _jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Auditee:" }), _jsx("span", { children: selectedAudit.auditee || 'N/A' })] }), selectedAudit.externalOrganization && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "External Organization:" }), _jsx("span", { children: selectedAudit.externalOrganization })] })), selectedAudit.auditorName && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Auditor Name:" }), _jsx("span", { children: selectedAudit.auditorName })] }))] })] }), _jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Schedule" }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Scheduled Date:" }), _jsx("span", { children: formatDate(selectedAudit.scheduledDate) })] }), selectedAudit.startDate && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Start Date:" }), _jsx("span", { children: formatDate(selectedAudit.startDate) })] })), selectedAudit.endDate && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "End Date:" }), _jsx("span", { children: formatDate(selectedAudit.endDate) })] })), selectedAudit.completionDate && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Completion Date:" }), _jsx("span", { children: formatDate(selectedAudit.completionDate) })] }))] })] }), _jsxs("div", { className: styles.statusSection, children: [_jsx("h3", { children: "Update Status" }), _jsx("div", { className: styles.statusButtons, children: ['planned', 'in_progress', 'report_draft', 'report_review', 'completed', 'closed'].map(status => (_jsx("button", { className: `${styles.statusBtn} ${selectedAudit.status === status ? styles.statusBtnActive : ''}`, onClick: () => handleStatusChange(selectedAudit, status), disabled: selectedAudit.status === status, children: status.replace(/_/g, ' ') }, status))) })] }), selectedAudit.leadAuditor && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Audit Team" }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Lead Auditor:" }), _jsxs("span", { children: [selectedAudit.leadAuditor.firstName, " ", selectedAudit.leadAuditor.lastName] })] }), selectedAudit.auditTeam && selectedAudit.auditTeam.length > 0 && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Team Members:" }), _jsx("span", { children: selectedAudit.auditTeam.map((member) => (`${member.firstName} ${member.lastName}`)).join(', ') })] }))] })] })), selectedAudit.findingsCount && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Findings Summary" }), _jsxs("div", { className: styles.findingsGrid, children: [_jsxs("div", { className: styles.findingCard, children: [_jsx("div", { className: styles.findingLabel, children: "Critical" }), _jsx("div", { className: `${styles.findingValue} ${styles.findingCritical}`, children: selectedAudit.findingsCount.critical })] }), _jsxs("div", { className: styles.findingCard, children: [_jsx("div", { className: styles.findingLabel, children: "Major" }), _jsx("div", { className: `${styles.findingValue} ${styles.findingMajor}`, children: selectedAudit.findingsCount.major })] }), _jsxs("div", { className: styles.findingCard, children: [_jsx("div", { className: styles.findingLabel, children: "Minor" }), _jsx("div", { className: `${styles.findingValue} ${styles.findingMinor}`, children: selectedAudit.findingsCount.minor })] }), _jsxs("div", { className: styles.findingCard, children: [_jsx("div", { className: styles.findingLabel, children: "Observation" }), _jsx("div", { className: `${styles.findingValue} ${styles.findingObservation}`, children: selectedAudit.findingsCount.observation })] })] })] })), selectedAudit.executiveSummary && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Executive Summary" }), _jsx("p", { children: selectedAudit.executiveSummary })] })), selectedAudit.followUpRequired && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Follow-up" }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Follow-up Required:" }), _jsx("span", { children: "Yes" })] }), selectedAudit.followUpDate && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Follow-up Date:" }), _jsx("span", { children: formatDate(selectedAudit.followUpDate) })] })), selectedAudit.capaGenerated && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "CAPA Generated:" }), _jsx("span", { children: "Yes" })] })), selectedAudit.capaReferences && selectedAudit.capaReferences.length > 0 && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "CAPA References:" }), _jsx("span", { children: selectedAudit.capaReferences.join(', ') })] }))] })] }))] })] })) })] }));
};
export default AuditList;
