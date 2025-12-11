import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import styles from './CAPAList.module.css';
const initialFormData = {
    title: '',
    description: '',
    type: 'Corrective',
    source: 'Deviation',
    sourceReference: '',
    priority: 'Medium',
    rootCause: '',
    correctiveActions: '',
    preventiveActions: '',
    targetDate: '',
};
const SOURCES = [
    'Deviation',
    'Audit Finding',
    'Customer Complaint',
    'OOS Result',
    'Risk Assessment',
    'Management Review',
    'Regulatory Inspection',
    'Internal Assessment',
    'Other',
];
const CAPAList = () => {
    const [capas, setCapas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCAPA, setSelectedCAPA] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    useEffect(() => {
        loadCAPAs();
    }, [statusFilter, priorityFilter]);
    const loadCAPAs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'all')
                params.status = statusFilter;
            if (priorityFilter !== 'all')
                params.priority = priorityFilter;
            const response = await apiService.getCAPAs(params);
            setCapas(response.data || []);
            setError(null);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load CAPAs');
            console.error('Error loading CAPAs:', err);
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
    const handleEdit = (capa) => {
        setFormData({
            title: capa.title,
            description: capa.description,
            type: capa.type,
            source: capa.source,
            sourceReference: capa.sourceReference || '',
            priority: capa.priority,
            rootCause: capa.rootCause || '',
            correctiveActions: capa.correctiveActions || '',
            preventiveActions: capa.preventiveActions || '',
            targetDate: capa.targetDate ? capa.targetDate.split('T')[0] : '',
        });
        setEditingId(capa._id);
        setShowForm(true);
        setSelectedCAPA(null);
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
                await apiService.updateCAPA(editingId, formData);
            }
            else {
                await apiService.createCAPA(formData);
            }
            handleCloseForm();
            loadCAPAs();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save CAPA');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this CAPA?'))
            return;
        try {
            await apiService.deleteCAPA(id);
            loadCAPAs();
            if (selectedCAPA?._id === id) {
                setSelectedCAPA(null);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete CAPA');
        }
    };
    const handleStatusChange = async (capa, newStatus) => {
        try {
            await apiService.updateCAPA(capa._id, { status: newStatus });
            loadCAPAs();
            if (selectedCAPA?._id === capa._id) {
                setSelectedCAPA({ ...selectedCAPA, status: newStatus });
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
            case 'open':
                return styles.statusOpen;
            case 'in_progress':
                return styles.statusInProgress;
            case 'pending_approval':
                return styles.statusPending;
            case 'approved':
                return styles.statusApproved;
            case 'implementation':
                return styles.statusImplementation;
            case 'effectiveness_check':
                return styles.statusCheck;
            case 'completed':
                return styles.statusCompleted;
            case 'closed':
                return styles.statusClosed;
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
        const total = capas.length;
        const inProgress = capas.filter((c) => c.status === 'in_progress' || c.status === 'implementation').length;
        const critical = capas.filter((c) => c.priority === 'Critical').length;
        const completed = capas.filter((c) => c.status === 'completed' || c.status === 'closed')
            .length;
        return { total, inProgress, critical, completed };
    };
    const stats = getStats();
    // Form view
    if (showForm) {
        return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.detailHeader, children: [_jsx("button", { className: styles.backBtn, onClick: handleCloseForm, children: "\u2190 Back to List" }), _jsx("h2", { children: editingId ? 'Edit CAPA' : 'New CAPA' })] }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "title", children: "Title *" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleInputChange, required: true, placeholder: "CAPA title" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "description", children: "Description *" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, required: true, rows: 3, placeholder: "Describe the issue requiring corrective/preventive action" })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "type", children: "Type *" }), _jsxs("select", { id: "type", name: "type", value: formData.type, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "Corrective", children: "Corrective" }), _jsx("option", { value: "Preventive", children: "Preventive" }), _jsx("option", { value: "Both", children: "Both" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "priority", children: "Priority *" }), _jsxs("select", { id: "priority", name: "priority", value: formData.priority, onChange: handleInputChange, required: true, children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Critical", children: "Critical" })] })] })] }), _jsxs("div", { className: styles.formRow, children: [_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "source", children: "Source *" }), _jsx("select", { id: "source", name: "source", value: formData.source, onChange: handleInputChange, required: true, children: SOURCES.map(src => (_jsx("option", { value: src, children: src }, src))) })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "sourceReference", children: "Source Reference" }), _jsx("input", { type: "text", id: "sourceReference", name: "sourceReference", value: formData.sourceReference, onChange: handleInputChange, placeholder: "e.g., DEV-2025-001" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "targetDate", children: "Target Completion Date" }), _jsx("input", { type: "date", id: "targetDate", name: "targetDate", value: formData.targetDate, onChange: handleInputChange })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "rootCause", children: "Root Cause Analysis" }), _jsx("textarea", { id: "rootCause", name: "rootCause", value: formData.rootCause, onChange: handleInputChange, rows: 3, placeholder: "Describe the root cause of the issue" })] }), (formData.type === 'Corrective' || formData.type === 'Both') && (_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "correctiveActions", children: "Corrective Actions" }), _jsx("textarea", { id: "correctiveActions", name: "correctiveActions", value: formData.correctiveActions, onChange: handleInputChange, rows: 3, placeholder: "Describe the corrective actions to be taken" })] })), (formData.type === 'Preventive' || formData.type === 'Both') && (_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { htmlFor: "preventiveActions", children: "Preventive Actions" }), _jsx("textarea", { id: "preventiveActions", name: "preventiveActions", value: formData.preventiveActions, onChange: handleInputChange, rows: 3, placeholder: "Describe the preventive actions to be taken" })] })), error && _jsx("div", { className: styles.error, children: error }), _jsxs("div", { className: styles.formActions, children: [_jsx("button", { type: "button", className: styles.secondaryBtn, onClick: handleCloseForm, children: "Cancel" }), _jsx("button", { type: "submit", className: styles.primaryBtn, disabled: submitting, children: submitting ? 'Saving...' : (editingId ? 'Update' : 'Create CAPA') })] })] })] }));
    }
    if (loading) {
        return (_jsx("div", { className: styles.container, children: _jsx("div", { className: styles.loading, children: "Loading CAPAs..." }) }));
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("header", { className: styles.header, children: [_jsxs("div", { children: [_jsx("h1", { children: "CAPA Management" }), _jsx("p", { className: styles.subtitle, children: "Corrective and Preventive Actions" })] }), _jsx("div", { className: styles.headerActions, children: _jsx("button", { className: styles.primaryBtn, onClick: handleCreate, children: "+ New CAPA" }) })] }), error && _jsx("div", { className: styles.error, children: error }), _jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "Total CAPAs" }), _jsx("div", { className: styles.statValue, children: stats.total })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "In Progress" }), _jsx("div", { className: styles.statValue, children: stats.inProgress })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "Critical" }), _jsx("div", { className: styles.statValue, children: stats.critical })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "Completed" }), _jsx("div", { className: styles.statValue, children: stats.completed })] })] }), _jsxs("div", { className: styles.filters, children: [_jsxs("div", { className: styles.filterGroup, children: [_jsx("label", { children: "Status:" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "pending_approval", children: "Pending Approval" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "implementation", children: "Implementation" }), _jsx("option", { value: "effectiveness_check", children: "Effectiveness Check" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "closed", children: "Closed" })] })] }), _jsxs("div", { className: styles.filterGroup, children: [_jsx("label", { children: "Priority:" }), _jsxs("select", { value: priorityFilter, onChange: (e) => setPriorityFilter(e.target.value), children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "Critical", children: "Critical" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "Low", children: "Low" })] })] })] }), _jsx("div", { className: styles.content, children: !selectedCAPA ? (_jsxs("div", { className: styles.listView, children: [_jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "CAPA #" }), _jsx("th", { children: "Title" }), _jsx("th", { children: "Type" }), _jsx("th", { children: "Source" }), _jsx("th", { children: "Priority" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Assigned To" }), _jsx("th", { children: "Target Date" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: capas.map((capa) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: capa.capaNumber }) }), _jsx("td", { children: capa.title }), _jsx("td", { children: _jsx("span", { className: styles.typeBadge, children: capa.type }) }), _jsx("td", { children: capa.source }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getPriorityBadgeClass(capa.priority)}`, children: capa.priority }) }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(capa.status)}`, children: capa.status.replace(/_/g, ' ') }) }), _jsx("td", { children: capa.assignedTo
                                                    ? `${capa.assignedTo.firstName} ${capa.assignedTo.lastName}`
                                                    : 'Unassigned' }), _jsx("td", { children: formatDate(capa.targetDate) }), _jsx("td", { children: _jsxs("div", { className: styles.actionBtns, children: [_jsx("button", { className: styles.viewBtn, onClick: () => setSelectedCAPA(capa), children: "\uD83D\uDC41\uFE0F" }), _jsx("button", { className: styles.viewBtn, onClick: () => handleEdit(capa), children: "\u270F\uFE0F" }), _jsx("button", { className: styles.viewBtn, onClick: () => handleDelete(capa._id), children: "\uD83D\uDDD1\uFE0F" })] }) })] }, capa._id))) })] }), capas.length === 0 && (_jsxs("div", { className: styles.emptyState, children: [_jsx("p", { children: "No CAPAs found" }), _jsx("button", { className: styles.primaryBtn, onClick: handleCreate, children: "Create your first CAPA" })] }))] })) : (_jsxs("div", { className: styles.detailView, children: [_jsxs("div", { className: styles.detailHeader, children: [_jsx("button", { className: styles.backBtn, onClick: () => setSelectedCAPA(null), children: "\u2190 Back to List" }), _jsxs("div", { className: styles.detailActions, children: [_jsx("button", { className: styles.editBtn, onClick: () => handleEdit(selectedCAPA), children: "Edit" }), _jsx("button", { className: styles.deleteBtn, onClick: () => handleDelete(selectedCAPA._id), children: "Delete" })] })] }), _jsxs("div", { className: styles.detailContent, children: [_jsxs("div", { className: styles.detailSection, children: [_jsxs("h2", { children: [selectedCAPA.capaNumber, " - ", selectedCAPA.title] }), _jsxs("div", { className: styles.detailBadges, children: [_jsx("span", { className: `${styles.badge} ${getPriorityBadgeClass(selectedCAPA.priority)}`, children: selectedCAPA.priority }), _jsx("span", { className: `${styles.badge} ${getStatusBadgeClass(selectedCAPA.status)}`, children: selectedCAPA.status.replace(/_/g, ' ') }), _jsx("span", { className: styles.typeBadge, children: selectedCAPA.type })] })] }), _jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Description" }), _jsx("p", { children: selectedCAPA.description })] }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Source:" }), _jsx("span", { children: selectedCAPA.source })] }), _jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Source Reference:" }), _jsx("span", { children: selectedCAPA.sourceReference || 'N/A' })] }), _jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Assigned To:" }), _jsx("span", { children: selectedCAPA.assignedTo
                                                        ? `${selectedCAPA.assignedTo.firstName} ${selectedCAPA.assignedTo.lastName}`
                                                        : 'Unassigned' })] }), _jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Target Date:" }), _jsx("span", { children: formatDate(selectedCAPA.targetDate) })] }), selectedCAPA.completionDate && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Completion Date:" }), _jsx("span", { children: formatDate(selectedCAPA.completionDate) })] }))] }), selectedCAPA.rootCause && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Root Cause Analysis" }), _jsx("p", { children: selectedCAPA.rootCause })] })), selectedCAPA.correctiveActions && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Corrective Actions" }), _jsx("p", { children: selectedCAPA.correctiveActions })] })), selectedCAPA.preventiveActions && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Preventive Actions" }), _jsx("p", { children: selectedCAPA.preventiveActions })] })), _jsxs("div", { className: styles.statusSection, children: [_jsx("h3", { children: "Update Status" }), _jsx("div", { className: styles.statusButtons, children: ['open', 'in_progress', 'pending_approval', 'approved', 'implementation', 'effectiveness_check', 'completed', 'closed'].map(status => (_jsx("button", { className: `${styles.statusBtn} ${selectedCAPA.status === status ? styles.statusBtnActive : ''}`, onClick: () => handleStatusChange(selectedCAPA, status), disabled: selectedCAPA.status === status, children: status.replace(/_/g, ' ') }, status))) })] }), selectedCAPA.actionPlan && Array.isArray(selectedCAPA.actionPlan) && selectedCAPA.actionPlan.length > 0 && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Action Plan" }), _jsxs("table", { className: styles.actionTable, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Action" }), _jsx("th", { children: "Responsible" }), _jsx("th", { children: "Due Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Completed" })] }) }), _jsx("tbody", { children: selectedCAPA.actionPlan.map((action, index) => (_jsxs("tr", { children: [_jsx("td", { children: action.action }), _jsx("td", { children: action.responsible }), _jsx("td", { children: formatDate(action.dueDate) }), _jsx("td", { children: _jsx("span", { className: `${styles.badge} ${action.status === 'Completed'
                                                                        ? styles.statusCompleted
                                                                        : styles.statusInProgress}`, children: action.status }) }), _jsx("td", { children: formatDate(action.completedDate) })] }, index))) })] })] })), selectedCAPA.effectivenessCheck?.required && (_jsxs("div", { className: styles.detailSection, children: [_jsx("h3", { children: "Effectiveness Check" }), _jsxs("div", { className: styles.detailGrid, children: [_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Scheduled Date:" }), _jsx("span", { children: formatDate(selectedCAPA.effectivenessCheck.scheduledDate) })] }), selectedCAPA.effectivenessCheck.completedDate && (_jsxs("div", { className: styles.detailField, children: [_jsx("label", { children: "Completed Date:" }), _jsx("span", { children: formatDate(selectedCAPA.effectivenessCheck.completedDate) })] }))] }), selectedCAPA.effectivenessCheck.result && (_jsxs(_Fragment, { children: [_jsx("h4", { children: "Result" }), _jsx("p", { children: selectedCAPA.effectivenessCheck.result })] })), selectedCAPA.effectivenessCheck.notes && (_jsxs(_Fragment, { children: [_jsx("h4", { children: "Notes" }), _jsx("p", { children: selectedCAPA.effectivenessCheck.notes })] }))] }))] })] })) })] }));
};
export default CAPAList;
