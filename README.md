# E-QMS Pharmacy System

A white-label Electronic Quality Management System for pharmacies with a hybrid architecture.

## Architecture

- **Desktop Application**: Electron + React + TypeScript (installed on client machines)
- **Cloud Backend**: Node.js + Express + PostgreSQL (hosted on cloud)
- **Multi-tenant**: Each pharmacy is isolated with tenant-based data segregation

## Project Structure

```
QMS_Pharm/
├── desktop-app/          # Electron desktop application
├── cloud-backend/        # Node.js API server
├── shared/              # Shared types and constants
└── docs/                # Documentation
```

## Features

### Core Modules
- Document Control (SOPs, Policies, Protocols)
- Change Control Management
- Deviation/Incident Management
- CAPA (Corrective and Preventive Actions)
- Audit Management
- Training Management
- Equipment & Calibration Management
- Supplier Qualification
- Complaint Management
- Risk Management

### Compliance
- 21 CFR Part 11 compliant (electronic signatures & audit trails)
- Multi-tenant isolation
- Role-based access control
- Complete audit logging

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

#### 1. Cloud Backend Setup
```bash
cd cloud-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev
```

#### 2. Desktop App Setup
```bash
cd desktop-app
npm install
cp .env.example .env
# Edit .env with your API endpoint
npm run dev
```

### Building Desktop App for Distribution
```bash
cd desktop-app
npm run build:win    # Windows installer
npm run build:mac    # macOS installer
npm run build:linux  # Linux installer
```

## White-Label Configuration

Each pharmacy gets a custom configuration file:

```json
{
  "tenantId": "pharmacy-unique-id",
  "branding": {
    "name": "Pharmacy Name",
    "logo": "path/to/logo.png",
    "primaryColor": "#0066cc",
    "secondaryColor": "#4a90e2"
  },
  "apiEndpoint": "https://api.yourdomain.com"
}
```

## Deployment

### Cloud Backend
- Deploy to AWS/Azure/GCP/DigitalOcean
- Use managed PostgreSQL service
- Set up SSL certificates
- Configure environment variables

### Desktop App Distribution
1. Build installer with custom branding
2. Distribute via download link or physical media
3. Client installs on their machines
4. App connects to cloud API

## License

Proprietary - All rights reserved
