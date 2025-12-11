export interface TenantConfig {
  tenantId: string;
  branding: {
    name: string;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  apiEndpoint: string;
}

export interface ElectronAPI {
  getConfig: () => Promise<any>;
  setConfig: (config: any) => Promise<{ success: boolean }>;
  getTenantInfo: () => Promise<TenantConfig | null>;
  setTenantInfo: (tenant: TenantConfig) => Promise<{ success: boolean }>;
  getAppVersion: () => Promise<string>;
  installUpdate: () => Promise<void>;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
