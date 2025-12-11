import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
class ApiService {
    api;
    token = null;
    tenantId = null;
    constructor() {
        this.api = axios.create({
            baseURL: `${API_URL}/api/${API_VERSION}`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Request interceptor
        this.api.interceptors.request.use((config) => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            if (this.tenantId) {
                config.headers['X-Tenant-ID'] = this.tenantId;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // Response interceptor
        this.api.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                this.clearAuth();
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }
    setAuth(token, tenantId) {
        this.token = token;
        this.tenantId = tenantId;
        localStorage.setItem('token', token);
        localStorage.setItem('tenantId', tenantId);
    }
    clearAuth() {
        this.token = null;
        this.tenantId = null;
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
    }
    loadAuthFromStorage() {
        this.token = localStorage.getItem('token');
        this.tenantId = localStorage.getItem('tenantId');
    }
    // Auth endpoints
    async login(email, password) {
        const response = await this.api.post('/auth/login', { email, password });
        return response.data;
    }
    async logout() {
        try {
            await this.api.post('/auth/logout');
        }
        finally {
            this.clearAuth();
        }
    }
    async getCurrentUser() {
        const response = await this.api.get('/auth/me');
        return response.data;
    }
    // Document endpoints
    async getDocuments(params) {
        const response = await this.api.get('/documents', { params });
        return response.data;
    }
    async getDocument(id) {
        const response = await this.api.get(`/documents/${id}`);
        return response.data;
    }
    async createDocument(data) {
        const response = await this.api.post('/documents', data);
        return response.data;
    }
    async updateDocument(id, data) {
        const response = await this.api.put(`/documents/${id}`, data);
        return response.data;
    }
    async deleteDocument(id) {
        const response = await this.api.delete(`/documents/${id}`);
        return response.data;
    }
    // Change Control endpoints
    async getChangeControls(params) {
        const response = await this.api.get('/change-controls', { params });
        return response.data;
    }
    async getChangeControl(id) {
        const response = await this.api.get(`/change-controls/${id}`);
        return response.data;
    }
    async createChangeControl(data) {
        const response = await this.api.post('/change-controls', data);
        return response.data;
    }
    async updateChangeControl(id, data) {
        const response = await this.api.put(`/change-controls/${id}`, data);
        return response.data;
    }
    async deleteChangeControl(id) {
        const response = await this.api.delete(`/change-controls/${id}`);
        return response.data;
    }
    // Deviation endpoints
    async getDeviations(params) {
        const response = await this.api.get('/deviations', { params });
        return response.data;
    }
    async getDeviation(id) {
        const response = await this.api.get(`/deviations/${id}`);
        return response.data;
    }
    async createDeviation(data) {
        const response = await this.api.post('/deviations', data);
        return response.data;
    }
    async updateDeviation(id, data) {
        const response = await this.api.put(`/deviations/${id}`, data);
        return response.data;
    }
    async deleteDeviation(id) {
        const response = await this.api.delete(`/deviations/${id}`);
        return response.data;
    }
    // CAPA endpoints
    async getCAPAs(params) {
        const response = await this.api.get('/capas', { params });
        return response.data;
    }
    async getCAPA(id) {
        const response = await this.api.get(`/capas/${id}`);
        return response.data;
    }
    async createCAPA(data) {
        const response = await this.api.post('/capas', data);
        return response.data;
    }
    async updateCAPA(id, data) {
        const response = await this.api.put(`/capas/${id}`, data);
        return response.data;
    }
    async deleteCAPA(id) {
        const response = await this.api.delete(`/capas/${id}`);
        return response.data;
    }
    // Audit endpoints
    async getAudits(params) {
        const response = await this.api.get('/audits', { params });
        return response.data;
    }
    async getAudit(id) {
        const response = await this.api.get(`/audits/${id}`);
        return response.data;
    }
    async createAudit(data) {
        const response = await this.api.post('/audits', data);
        return response.data;
    }
    async updateAudit(id, data) {
        const response = await this.api.put(`/audits/${id}`, data);
        return response.data;
    }
    async deleteAudit(id) {
        const response = await this.api.delete(`/audits/${id}`);
        return response.data;
    }
    // Training endpoints
    async getTrainings(params) {
        const response = await this.api.get('/trainings', { params });
        return response.data;
    }
    async getTraining(id) {
        const response = await this.api.get(`/trainings/${id}`);
        return response.data;
    }
    async createTraining(data) {
        const response = await this.api.post('/trainings', data);
        return response.data;
    }
    async updateTraining(id, data) {
        const response = await this.api.put(`/trainings/${id}`, data);
        return response.data;
    }
    async deleteTraining(id) {
        const response = await this.api.delete(`/trainings/${id}`);
        return response.data;
    }
    // Report endpoints
    async getDashboardStats() {
        const response = await this.api.get('/reports/dashboard');
        return response.data;
    }
    async getComplianceSummary() {
        const response = await this.api.get('/reports/compliance');
        return response.data;
    }
    async getModuleReport(module, params) {
        const response = await this.api.get(`/reports/module/${module}`, { params });
        return response.data;
    }
    // User endpoints
    async getUsers(params) {
        const response = await this.api.get('/users', { params });
        return response.data;
    }
    async getUser(id) {
        const response = await this.api.get(`/users/${id}`);
        return response.data;
    }
    async createUser(data) {
        const response = await this.api.post('/users', data);
        return response.data;
    }
    async updateUser(id, data) {
        const response = await this.api.put(`/users/${id}`, data);
        return response.data;
    }
    async getUsersByRole(roles) {
        const params = roles ? { roles } : undefined;
        const response = await this.api.get('/users/by-role', { params });
        return response.data;
    }
    async getProfile() {
        const response = await this.api.get('/users/profile');
        return response.data;
    }
    // Notification endpoints
    async getNotifications(page, limit) {
        const params = { page: page || 1, limit: limit || 20 };
        const response = await this.api.get('/notifications', { params });
        return response.data;
    }
    async getUnreadNotifications() {
        const response = await this.api.get('/notifications/unread');
        return response.data;
    }
    async getUnreadNotificationCount() {
        const response = await this.api.get('/notifications/unread/count');
        return response.data;
    }
    async markNotificationAsRead(id) {
        const response = await this.api.patch(`/notifications/${id}/read`);
        return response.data;
    }
    async markAllNotificationsAsRead() {
        const response = await this.api.patch('/notifications/read-all');
        return response.data;
    }
    // Training Assignment endpoints
    async getMyAssignments(status) {
        const params = status ? { status } : undefined;
        const response = await this.api.get('/training-assignments/my', { params });
        return response.data;
    }
    async getAssignmentDetails(id) {
        const response = await this.api.get(`/training-assignments/my/${id}`);
        return response.data;
    }
    async startTraining(assignmentId) {
        const response = await this.api.patch(`/training-assignments/my/${assignmentId}/start`);
        return response.data;
    }
    async completeContent(assignmentId, contentId, timeSpent) {
        const response = await this.api.patch(`/training-assignments/my/${assignmentId}/content/${contentId}/complete`, { timeSpent });
        return response.data;
    }
    async assignTraining(trainingId, userIds, roleFilter, dueDate) {
        const response = await this.api.post('/training-assignments/assign', {
            trainingId,
            userIds,
            roleFilter,
            dueDate,
        });
        return response.data;
    }
    async getAllAssignments(params) {
        const response = await this.api.get('/training-assignments', { params });
        return response.data;
    }
    async getAssignmentStats() {
        const response = await this.api.get('/training-assignments/stats');
        return response.data;
    }
    async resetAssignment(assignmentId) {
        const response = await this.api.patch(`/training-assignments/${assignmentId}/reset`);
        return response.data;
    }
    async issueCertificateForAssignment(assignmentId) {
        const response = await this.api.post(`/training-assignments/${assignmentId}/issue-certificate`);
        return response.data;
    }
    // Exam endpoints
    async getExamForTaking(assignmentId) {
        const response = await this.api.get(`/exams/take/${assignmentId}`);
        return response.data;
    }
    async startExamAttempt(assignmentId) {
        const response = await this.api.post(`/exams/attempt/${assignmentId}`);
        return response.data;
    }
    async submitExam(attemptId, answers) {
        const response = await this.api.post(`/exams/submit/${attemptId}`, { answers });
        return response.data;
    }
    async createExam(data) {
        const response = await this.api.post('/exams', data);
        return response.data;
    }
    async getExamAdmin(id) {
        const response = await this.api.get(`/exams/admin/${id}`);
        return response.data;
    }
    async getExamResults(trainingId) {
        const response = await this.api.get(`/exams/results/${trainingId}`);
        return response.data;
    }
    // Certificate endpoints
    async getMyCertificates() {
        const response = await this.api.get('/certificates/my');
        return response.data;
    }
    async getCertificate(id) {
        const response = await this.api.get(`/certificates/${id}`);
        return response.data;
    }
    async downloadCertificate(id) {
        const response = await this.api.get(`/certificates/${id}/download`);
        return response.data;
    }
    async verifyCertificate(code) {
        const response = await this.api.get(`/certificates/verify/${code}`);
        return response.data;
    }
    async getAllCertificates(params) {
        const response = await this.api.get('/certificates', { params });
        return response.data;
    }
    async getCertificateStats() {
        const response = await this.api.get('/certificates/stats/summary');
        return response.data;
    }
    // Download certificate as PDF
    async downloadCertificatePDF(id) {
        const response = await this.api.get(`/certificates/${id}/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    }
    // Training Content endpoints
    async getTrainingContent(trainingId) {
        const response = await this.api.get(`/training-content/${trainingId}`);
        return response.data;
    }
    async uploadTrainingContent(trainingId, formData) {
        const response = await this.api.post(`/training-content/${trainingId}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
    async addTrainingContentLink(trainingId, data) {
        const response = await this.api.post(`/training-content/${trainingId}/link`, data);
        return response.data;
    }
    async updateTrainingContent(contentId, data) {
        const response = await this.api.put(`/training-content/item/${contentId}`, data);
        return response.data;
    }
    async deleteTrainingContent(contentId) {
        const response = await this.api.delete(`/training-content/item/${contentId}`);
        return response.data;
    }
    async reorderTrainingContent(trainingId, contentIds) {
        const response = await this.api.patch(`/training-content/${trainingId}/reorder`, { contentIds });
        return response.data;
    }
    // Process PPT to generate slides (for existing PPT content without slides)
    async processPptSlides(contentId) {
        const response = await this.api.post(`/training-content/item/${contentId}/process-slides`);
        return response.data;
    }
    // Get base URL for file uploads
    getUploadUrl(path) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${path}`;
    }
}
export const apiService = new ApiService();
export default apiService;
