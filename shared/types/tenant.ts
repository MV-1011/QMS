export interface TenantBranding {
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  favicon?: string;
}

export interface TenantConfig {
  tenantId: string;
  name: string;
  subdomain?: string;
  licenseKey: string;
  branding: TenantBranding;
  apiEndpoint: string;
  maxUsers?: number;
  isActive: boolean;
}

export interface WhiteLabelConfig {
  tenant: TenantConfig;
  features: {
    documentControl: boolean;
    changeControl: boolean;
    deviations: boolean;
    capa: boolean;
    audits: boolean;
    training: boolean;
    equipment: boolean;
    suppliers: boolean;
    complaints: boolean;
  };
  settings: {
    language: string;
    timezone: string;
    dateFormat: string;
    currency?: string;
  };
}
