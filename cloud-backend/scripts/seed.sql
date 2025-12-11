-- Seed data for testing
-- Password for all demo users: 'password123'
-- Password hash generated with bcrypt

-- Demo Tenant 1
INSERT INTO tenants (id, name, subdomain, license_key, branding, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'ABC Pharmacy',
    'abc-pharmacy',
    'LIC-ABC-PHARM-2024-001',
    '{"name": "ABC Pharmacy", "logo": "", "primaryColor": "#0066cc", "secondaryColor": "#4a90e2"}',
    true
);

-- Demo Tenant 2
INSERT INTO tenants (id, name, subdomain, license_key, branding, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'XYZ Medical Store',
    'xyz-medical',
    'LIC-XYZ-MED-2024-002',
    '{"name": "XYZ Medical Store", "logo": "", "primaryColor": "#28a745", "secondaryColor": "#20c997"}',
    true
);

-- Demo Users for Tenant 1 (ABC Pharmacy)
-- Password: password123
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'admin@abcpharmacy.com',
    '$2b$10$YQZ5qF5YqF5YqF5YqF5Yq.YqF5YqF5YqF5YqF5YqF5YqF5YqF5Yq',
    'John',
    'Admin',
    'admin',
    true
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'qm@abcpharmacy.com',
    '$2b$10$YQZ5qF5YqF5YqF5YqF5Yq.YqF5YqF5YqF5YqF5YqF5YqF5YqF5Yq',
    'Sarah',
    'Manager',
    'quality_manager',
    true
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'user@abcpharmacy.com',
    '$2b$10$YQZ5qF5YqF5YqF5YqF5Yq.YqF5YqF5YqF5YqF5YqF5YqF5YqF5Yq',
    'Mike',
    'User',
    'user',
    true
);

-- Demo Users for Tenant 2 (XYZ Medical)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES
(
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'admin@xyzmedical.com',
    '$2b$10$YQZ5qF5YqF5YqF5YqF5Yq.YqF5YqF5YqF5YqF5YqF5YqF5YqF5Yq',
    'Jane',
    'Director',
    'admin',
    true
);

-- Sample Documents for Tenant 1
INSERT INTO documents (tenant_id, title, document_number, document_type, content, version, status, created_by, updated_by)
VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Standard Operating Procedure - Inventory Management',
    'SOP-INV-001',
    'SOP',
    'This SOP describes the process for managing pharmacy inventory...',
    '1.0',
    'approved',
    '660e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Quality Policy Document',
    'POL-QM-001',
    'Policy',
    'Our commitment to quality in pharmaceutical services...',
    '2.0',
    'approved',
    '660e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001'
);

-- Sample Change Control for Tenant 1
INSERT INTO change_controls (tenant_id, change_number, title, description, change_type, priority, status, requestor_id, created_by, updated_by)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'CC-2024-001',
    'Update Storage Temperature Monitoring Process',
    'Update the process to include new temperature sensors',
    'Process Change',
    'Medium',
    'in_review',
    '660e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002'
);

-- Sample Deviation for Tenant 1
INSERT INTO deviations (tenant_id, deviation_number, title, description, severity, category, status, reported_by, created_by, updated_by, occurrence_date)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'DEV-2024-001',
    'Temperature Excursion in Storage Area',
    'Temperature exceeded acceptable range for 2 hours',
    'Major',
    'Environmental',
    'investigation',
    '660e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    NOW() - INTERVAL '2 days'
);

COMMIT;
