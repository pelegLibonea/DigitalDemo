# Multi-Role Document Processing System - Implementation Plan

> **Project:** DigitalDemo  
> **Created:** December 7, 2025  
> **Last Updated:** December 7, 2025  
> **Status:** Planning Complete - Ready for Phase 0  
> **Auth Provider:** Supabase (Online) / Self-Hosted (On-Premise)  
> **Deployment Modes:** ☁️ Online (SaaS) | 🏢 On-Premise (Self-Hosted)  

---

## 🔀 Dual Deployment Strategy

This system supports **two deployment modes** from the same codebase:

| Aspect | ☁️ Online (SaaS) | 🏢 On-Premise |
|--------|------------------|---------------|
| **Target Market** | SMBs, Startups, General | Enterprises, Banks, Government, Healthcare |
| **Auth Provider** | Supabase Cloud | Self-hosted Supabase / Keycloak / LDAP |
| **Database** | Supabase PostgreSQL | Local PostgreSQL / Customer's DB |
| **File Storage** | Supabase Storage / S3 | Local filesystem / MinIO / NAS |
| **OCR Processing** | Cloud API (Azure/AWS) | Local Tesseract / on-prem OCR |
| **Updates** | Automatic | Manual / Air-gapped |
| **Pricing Model** | Subscription (per doc/user) | License + Support Contract |
| **Data Residency** | Multi-region cloud | Customer's data center |
| **Compliance** | SOC2, GDPR | HIPAA, PCI-DSS, Air-gapped |

### Architecture Principles

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED CODEBASE                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Backend (FastAPI)                  │
│  - Same UI            │  - Same business logic              │
│  - Config-driven      │  - Pluggable auth adapters          │
│  - Feature flags      │  - Pluggable storage adapters       │
└───────────┬───────────┴───────────────┬─────────────────────┘
            │                           │
    ┌───────┴───────┐           ┌───────┴───────┐
    │ ☁️ ONLINE      │           │ 🏢 ON-PREMISE  │
    ├───────────────┤           ├───────────────┤
    │ Supabase Auth │           │ Keycloak/LDAP │
    │ Supabase DB   │           │ Local Postgres│
    │ Supabase Store│           │ MinIO/NFS     │
    │ Cloud OCR     │           │ Local OCR     │
    │ Auto updates  │           │ Manual updates│
    └───────────────┘           └───────────────┘
```

### Key Design Decisions

1. **Abstract Services Layer** - All external dependencies (auth, storage, OCR) go through adapters
2. **Environment-Driven Config** - Single `.env` file switches between modes
3. **Feature Flags** - Disable SaaS-specific features in on-prem
4. **Docker-First** - Both modes deploy via Docker Compose
5. **Offline-First APIs** - Backend works without internet connection

---

## Quick Status Overview

| Phase | Name | Status | Est. Duration |
|-------|------|--------|---------------|
| 0 | Infrastructure & Abstraction Layer | ⬜ Not Started | 2-3 days |
| 1 | Authentication & User Management | ⬜ Not Started | 3-5 days |
| 2 | Client Portal | ⬜ Not Started | 1 week |
| 3 | Labeler Workspace | ⬜ Not Started | 2 weeks |
| 4 | Admin Portal | ⬜ Not Started | 1-2 weeks |
| 5 | Analytics & Reporting | ⬜ Not Started | 1-2 weeks |
| 6 | Notifications & Communication | ⬜ Not Started | 3-5 days |
| 7 | On-Premise Packaging | ⬜ Not Started | 1 week |
| 8 | Polish & Production | ⬜ Not Started | 1 week |

**Legend:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Estimated Total:** 10-12 weeks

---

## Why Supabase? (Online Mode)

| Feature | Benefit |
|---------|---------|
| **PostgreSQL** | Same SQL you know, powerful queries |
| **Built-in Auth** | Secure, battle-tested, saves 1-2 weeks |
| **Row Level Security** | Database-level access control per role |
| **Realtime** | Replace SSE with built-in subscriptions |
| **Storage** | Built-in file storage for documents |
| **Self-hostable** | Can move off cloud if needed |
| **Free Tier** | 50k monthly active users, 500MB DB |

## On-Premise Alternatives

| Online (Supabase) | On-Premise Alternative | Notes |
|-------------------|------------------------|-------|
| Supabase Auth | **Keycloak** / **Authentik** / **LDAP/AD** | Keycloak preferred for enterprise |
| Supabase PostgreSQL | **Local PostgreSQL** | Same schema, same queries |
| Supabase Storage | **MinIO** / **Local FS** / **NFS** | S3-compatible for easy switch |
| Supabase Realtime | **WebSockets** / **Socket.io** | Self-hosted pub/sub |
| Cloud OCR (Azure) | **Tesseract** / **PaddleOCR** | Fully offline capable |
| Sentry | **Self-hosted Sentry** / **GlitchTip** | Error tracking on-prem |
| Email (SendGrid) | **Local SMTP** / **Mailhog** | Customer's mail server |

---

## User Roles & Permissions Matrix

| Feature | Admin | Client | Labeler |
|---------|-------|--------|---------|
| **Documents** |
| View all documents | ✅ | Own org only | Assigned only |
| Upload documents | ✅ | ✅ | ❌ |
| Delete documents | ✅ | Own only | ❌ |
| Label/verify documents | ✅ | ❌ | ✅ |
| Approve documents | ✅ | ❌ | ✅ |
| **Users & Orgs** |
| View all users | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Invite team members | ✅ | ✅ (own org) | ❌ |
| Manage organizations | ✅ | ❌ | ❌ |
| **Analytics** |
| View own stats | ✅ | ✅ | ✅ |
| View all stats | ✅ | ❌ | ❌ |
| View billing | ✅ | Own only | ❌ |
| **Reports** |
| Generate own reports | ✅ | ✅ | ✅ |
| Generate all reports | ✅ | ❌ | ❌ |
| **System** |
| System settings | ✅ | ❌ | ❌ |
| Assign documents | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

---

## Phase 0: Infrastructure & Abstraction Layer

**Status:** ⬜ Not Started  
**Estimated Duration:** 2-3 days  
**Dependencies:** None  
**Priority:** 🔴 Critical  

### Goal
Create an abstraction layer that allows the same codebase to run in both Online (SaaS) and On-Premise modes by switching configuration.

### Configuration System

Create unified config that switches between modes:

```python
# backend/app/config.py
from pydantic_settings import BaseSettings
from enum import Enum

class DeploymentMode(str, Enum):
    ONLINE = "online"      # Supabase cloud
    ONPREMISE = "onpremise"  # Self-hosted

class Settings(BaseSettings):
    # Deployment mode
    DEPLOYMENT_MODE: DeploymentMode = DeploymentMode.ONLINE
    
    # ===== SHARED =====
    SECRET_KEY: str
    DATABASE_URL: str
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    
    # ===== AUTH PROVIDER =====
    # Online: Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # On-Premise: Keycloak or Local
    AUTH_PROVIDER: str = "supabase"  # supabase | keycloak | local | ldap
    KEYCLOAK_URL: str = ""
    KEYCLOAK_REALM: str = ""
    KEYCLOAK_CLIENT_ID: str = ""
    KEYCLOAK_CLIENT_SECRET: str = ""
    LDAP_URL: str = ""
    LDAP_BASE_DN: str = ""
    
    # ===== STORAGE =====
    STORAGE_PROVIDER: str = "supabase"  # supabase | s3 | minio | local
    # S3/MinIO
    S3_ENDPOINT: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = "documents"
    # Local filesystem
    LOCAL_STORAGE_PATH: str = "./storage"
    
    # ===== OCR =====
    OCR_PROVIDER: str = "azure"  # azure | aws | tesseract | paddleocr
    AZURE_OCR_ENDPOINT: str = ""
    AZURE_OCR_KEY: str = ""
    # Tesseract (on-prem)
    TESSERACT_PATH: str = "/usr/bin/tesseract"
    
    # ===== NOTIFICATIONS =====
    EMAIL_PROVIDER: str = "sendgrid"  # sendgrid | smtp | none
    SENDGRID_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # ===== FEATURE FLAGS =====
    ENABLE_REALTIME: bool = True
    ENABLE_EMAIL_NOTIFICATIONS: bool = True
    ENABLE_BILLING: bool = True  # Disable for on-prem license
    ENABLE_ANALYTICS: bool = True
    ENABLE_TELEMETRY: bool = True  # Disable for air-gapped
    
    class Config:
        env_file = ".env"
```

```typescript
// frontend/src/config/environment.ts
export type DeploymentMode = 'online' | 'onpremise';

export interface EnvironmentConfig {
  mode: DeploymentMode;
  
  // API
  apiUrl: string;
  
  // Auth
  authProvider: 'supabase' | 'keycloak' | 'local';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  
  // Features
  features: {
    realtime: boolean;
    emailNotifications: boolean;
    billing: boolean;
    analytics: boolean;
  };
}

export const config: EnvironmentConfig = {
  mode: import.meta.env.VITE_DEPLOYMENT_MODE || 'online',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  authProvider: import.meta.env.VITE_AUTH_PROVIDER || 'supabase',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL,
  keycloakRealm: import.meta.env.VITE_KEYCLOAK_REALM,
  keycloakClientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  
  features: {
    realtime: import.meta.env.VITE_FEATURE_REALTIME !== 'false',
    emailNotifications: import.meta.env.VITE_FEATURE_EMAIL !== 'false',
    billing: import.meta.env.VITE_FEATURE_BILLING !== 'false',
    analytics: import.meta.env.VITE_FEATURE_ANALYTICS !== 'false',
  },
};
```

### Service Adapters (Backend)

Create pluggable adapters for each service:

```python
# backend/app/adapters/auth/__init__.py
from abc import ABC, abstractmethod
from typing import Optional
from app.schemas import User

class AuthAdapter(ABC):
    @abstractmethod
    async def verify_token(self, token: str) -> Optional[User]:
        pass
    
    @abstractmethod
    async def get_user(self, user_id: str) -> Optional[User]:
        pass
    
    @abstractmethod
    async def create_user(self, email: str, password: str, **kwargs) -> User:
        pass

# backend/app/adapters/auth/supabase.py
class SupabaseAuthAdapter(AuthAdapter):
    def __init__(self, url: str, service_key: str):
        self.client = create_client(url, service_key)
    
    async def verify_token(self, token: str) -> Optional[User]:
        # Verify JWT with Supabase
        ...

# backend/app/adapters/auth/keycloak.py
class KeycloakAuthAdapter(AuthAdapter):
    def __init__(self, url: str, realm: str, client_id: str):
        self.keycloak = KeycloakOpenID(...)
    
    async def verify_token(self, token: str) -> Optional[User]:
        # Verify JWT with Keycloak
        ...

# backend/app/adapters/auth/local.py
class LocalAuthAdapter(AuthAdapter):
    # Simple JWT auth for on-prem without external IdP
    ...
```

```python
# backend/app/adapters/storage/__init__.py
from abc import ABC, abstractmethod

class StorageAdapter(ABC):
    @abstractmethod
    async def upload(self, path: str, data: bytes, content_type: str) -> str:
        pass
    
    @abstractmethod
    async def download(self, path: str) -> bytes:
        pass
    
    @abstractmethod
    async def delete(self, path: str) -> bool:
        pass
    
    @abstractmethod
    async def get_url(self, path: str, expires: int = 3600) -> str:
        pass

# Implementations: supabase.py, s3.py, minio.py, local.py
```

```python
# backend/app/adapters/ocr/__init__.py
from abc import ABC, abstractmethod

class OCRAdapter(ABC):
    @abstractmethod
    async def process_document(self, file_path: str) -> dict:
        pass

# Implementations: azure.py, aws.py, tesseract.py, paddleocr.py
```

### Service Factory

```python
# backend/app/services/factory.py
from app.config import settings
from app.adapters.auth import SupabaseAuthAdapter, KeycloakAuthAdapter, LocalAuthAdapter
from app.adapters.storage import SupabaseStorageAdapter, MinIOStorageAdapter, LocalStorageAdapter
from app.adapters.ocr import AzureOCRAdapter, TesseractOCRAdapter

def get_auth_adapter():
    if settings.AUTH_PROVIDER == "supabase":
        return SupabaseAuthAdapter(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    elif settings.AUTH_PROVIDER == "keycloak":
        return KeycloakAuthAdapter(settings.KEYCLOAK_URL, settings.KEYCLOAK_REALM, settings.KEYCLOAK_CLIENT_ID)
    elif settings.AUTH_PROVIDER == "ldap":
        return LDAPAuthAdapter(settings.LDAP_URL, settings.LDAP_BASE_DN)
    else:
        return LocalAuthAdapter(settings.SECRET_KEY)

def get_storage_adapter():
    if settings.STORAGE_PROVIDER == "supabase":
        return SupabaseStorageAdapter(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    elif settings.STORAGE_PROVIDER in ("s3", "minio"):
        return MinIOStorageAdapter(settings.S3_ENDPOINT, settings.S3_ACCESS_KEY, settings.S3_SECRET_KEY)
    else:
        return LocalStorageAdapter(settings.LOCAL_STORAGE_PATH)

def get_ocr_adapter():
    if settings.OCR_PROVIDER == "azure":
        return AzureOCRAdapter(settings.AZURE_OCR_ENDPOINT, settings.AZURE_OCR_KEY)
    elif settings.OCR_PROVIDER == "tesseract":
        return TesseractOCRAdapter(settings.TESSERACT_PATH)
    elif settings.OCR_PROVIDER == "paddleocr":
        return PaddleOCRAdapter()
    else:
        raise ValueError(f"Unknown OCR provider: {settings.OCR_PROVIDER}")
```

### Frontend Auth Abstraction

```typescript
// frontend/src/lib/auth/index.ts
import { config } from '@/config/environment';
import { SupabaseAuthProvider } from './supabase';
import { KeycloakAuthProvider } from './keycloak';
import { LocalAuthProvider } from './local';

export interface AuthProvider {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, metadata?: any): Promise<User>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

export function getAuthProvider(): AuthProvider {
  switch (config.authProvider) {
    case 'supabase':
      return new SupabaseAuthProvider();
    case 'keycloak':
      return new KeycloakAuthProvider();
    case 'local':
    default:
      return new LocalAuthProvider();
  }
}
```

### Environment Files

```bash
# ===== ONLINE MODE =====
# backend/.env.online
DEPLOYMENT_MODE=online
AUTH_PROVIDER=supabase
STORAGE_PROVIDER=supabase
OCR_PROVIDER=azure
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://...supabase.co:5432/postgres
AZURE_OCR_ENDPOINT=https://xxxxx.cognitiveservices.azure.com/
AZURE_OCR_KEY=...
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG....
ENABLE_BILLING=true
ENABLE_TELEMETRY=true

# frontend/.env.online
VITE_DEPLOYMENT_MODE=online
VITE_API_URL=https://api.yourservice.com
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FEATURE_BILLING=true
```

```bash
# ===== ON-PREMISE MODE =====
# backend/.env.onpremise
DEPLOYMENT_MODE=onpremise
AUTH_PROVIDER=keycloak  # or ldap, local
STORAGE_PROVIDER=minio  # or local
OCR_PROVIDER=tesseract  # or paddleocr

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/docprocessing

# Keycloak (if using)
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=docprocessing
KEYCLOAK_CLIENT_ID=backend
KEYCLOAK_CLIENT_SECRET=...

# MinIO (if using)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=documents

# Local storage (alternative to MinIO)
LOCAL_STORAGE_PATH=/data/documents

# Local email
EMAIL_PROVIDER=smtp
SMTP_HOST=mailserver.internal
SMTP_PORT=25

# Disable cloud features
ENABLE_BILLING=false
ENABLE_TELEMETRY=false

# frontend/.env.onpremise
VITE_DEPLOYMENT_MODE=onpremise
VITE_API_URL=http://localhost:8000
VITE_AUTH_PROVIDER=keycloak
VITE_KEYCLOAK_URL=http://keycloak:8080
VITE_KEYCLOAK_REALM=docprocessing
VITE_KEYCLOAK_CLIENT_ID=frontend
VITE_FEATURE_BILLING=false
```

### Database Setup

The PostgreSQL schema is **identical** for both modes. The only difference is where it runs:

| Mode | Database |
|------|----------|
| ☁️ Online | Supabase Cloud PostgreSQL |
| 🏢 On-Premise | Local PostgreSQL (Docker or customer's existing DB) |

### Supabase Project Setup (Online Mode)

- [ ] Create account at [supabase.com](https://supabase.com)
- [ ] Create new project (choose region close to users)
- [ ] Note down credentials:
  - [ ] Project URL (`VITE_SUPABASE_URL`)
  - [ ] Anon/Public Key (`VITE_SUPABASE_ANON_KEY`)
  - [ ] Service Role Key (backend only, never expose)
  - [ ] JWT Secret (for backend verification)
  - [ ] Database connection string

### Environment Variables

Create `.env` files:

```bash
# Frontend: frontend/.env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend: backend/.env.local
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### Install Dependencies

```bash
# Frontend (both modes)
cd frontend
npm install @supabase/supabase-js keycloak-js

# Backend - Online Mode
cd backend
pip install supabase python-jose[cryptography] psycopg2-binary boto3

# Backend - On-Premise Mode (additional)
pip install python-keycloak pytesseract paddleocr ldap3 minio
```

### Docker Compose - On-Premise Stack

```yaml
# docker-compose.onpremise.yml
version: '3.8'

services:
  # ===================
  # DATABASE
  # ===================
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: docprocessing
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # ===================
  # AUTHENTICATION
  # ===================
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: ${DB_PASSWORD}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    command: start-dev
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

  # ===================
  # FILE STORAGE
  # ===================
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    restart: unless-stopped

  # ===================
  # BACKEND API
  # ===================
  backend:
    build: ./backend
    environment:
      DEPLOYMENT_MODE: onpremise
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/docprocessing
      AUTH_PROVIDER: keycloak
      KEYCLOAK_URL: http://keycloak:8080
      STORAGE_PROVIDER: minio
      S3_ENDPOINT: http://minio:9000
      OCR_PROVIDER: tesseract
    volumes:
      - ./storage:/app/storage
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - keycloak
      - minio
    restart: unless-stopped

  # ===================
  # FRONTEND
  # ===================
  frontend:
    build: 
      context: ./frontend
      args:
        VITE_DEPLOYMENT_MODE: onpremise
        VITE_API_URL: http://localhost:8000
        VITE_AUTH_PROVIDER: keycloak
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  # ===================
  # OPTIONAL: LOCAL EMAIL
  # ===================
  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"  # Web UI
      - "1025:1025"  # SMTP
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

### Database Schema

Run in Supabase SQL Editor:

```sql
-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client', 'labeler')),
    is_active BOOLEAN DEFAULT TRUE,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    billing_email TEXT,
    billing_address JSONB,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION MEMBERS (many-to-many)
-- =====================================================
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    UNIQUE(organization_id, user_id)
);

-- =====================================================
-- DOCUMENTS TABLE (updated)
-- =====================================================
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    doc_type TEXT,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'ready', 'in_review', 'approved', 'rejected', 'error')),
    priority INTEGER DEFAULT 0,
    
    -- Ownership
    uploaded_by UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Processing results
    result_pdf_path TEXT,
    result_json_path TEXT,
    extracted_data JSONB,
    
    -- OCR metadata
    page_count INTEGER,
    ocr_confidence FLOAT,
    processing_time_ms INTEGER,
    
    -- Timestamps
    upload_time TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- DOCUMENT ASSIGNMENTS
-- =====================================================
CREATE TABLE public.document_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    labeler_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'reassigned')),
    notes TEXT,
    completed_at TIMESTAMPTZ
);

-- =====================================================
-- LABELING SESSIONS (time tracking)
-- =====================================================
CREATE TABLE public.labeling_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    labeler_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id),
    
    -- Session timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        CASE WHEN ended_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER 
        ELSE NULL END
    ) STORED,
    
    -- Session metadata
    doc_type TEXT,
    page_count INTEGER,
    fields_edited INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'paused')),
    
    -- Quality metrics
    corrections_made INTEGER DEFAULT 0,
    confidence_before FLOAT,
    confidence_after FLOAT
);

-- =====================================================
-- DOCUMENT HISTORY / AUDIT LOG
-- =====================================================
CREATE TABLE public.document_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG (system-wide)
-- =====================================================
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    organization_id UUID REFERENCES organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BILLING RECORDS
-- =====================================================
CREATE TABLE public.billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    documents_processed INTEGER DEFAULT 0,
    pages_processed INTEGER DEFAULT 0,
    labeling_hours FLOAT DEFAULT 0,
    amount_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')),
    invoice_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LABELER PAYROLL
-- =====================================================
CREATE TABLE public.labeler_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labeler_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    documents_completed INTEGER DEFAULT 0,
    total_hours FLOAT DEFAULT 0,
    base_rate_cents INTEGER,
    bonus_cents INTEGER DEFAULT 0,
    total_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SAVED REPORTS
-- =====================================================
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    parameters JSONB,
    file_path TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
    error_message TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_upload_time ON documents(upload_time DESC);
CREATE INDEX idx_assignments_labeler ON document_assignments(labeler_id, status);
CREATE INDEX idx_assignments_document ON document_assignments(document_id);
CREATE INDEX idx_sessions_labeler ON labeling_sessions(labeler_id);
CREATE INDEX idx_sessions_org ON labeling_sessions(organization_id);
CREATE INDEX idx_sessions_dates ON labeling_sessions(started_at, ended_at);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE labeling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Documents: Based on role
CREATE POLICY "Admins can do everything with documents"
    ON documents FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Clients see own org documents"
    ON documents FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can insert to own org"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Labelers see assigned documents"
    ON documents FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT document_id FROM document_assignments 
            WHERE labeler_id = auth.uid()
        )
    );

-- Notifications: Own only
CREATE POLICY "Users see own notifications"
    ON notifications FOR ALL
    TO authenticated
    USING (user_id = auth.uid());
```

### Migrate Existing Data (if any)

- [ ] Export current SQLite data
- [ ] Transform data to match new schema
- [ ] Import into PostgreSQL (Supabase or Local)
- [ ] Verify data integrity

### Completion Criteria

**Both Modes:**
- [ ] Config system reads environment variables
- [ ] Adapter interfaces defined
- [ ] Service factory working
- [ ] PostgreSQL schema created

**Online Mode:**
- [ ] Supabase project created
- [ ] All tables created with RLS
- [ ] Environment variables set
- [ ] Supabase dependencies installed

**On-Premise Mode:**
- [ ] Docker Compose stack defined
- [ ] Local PostgreSQL running
- [ ] Keycloak or local auth configured
- [ ] MinIO or local storage configured
- [ ] Tesseract OCR working

### Notes

_Add implementation notes here_

---

## Phase 1: Authentication & User Management

**Status:** ⬜ Not Started  
**Estimated Duration:** 3-5 days  
**Dependencies:** Phase 0  
**Priority:** 🔴 Critical  

### Auth Strategy by Mode

| Feature | ☁️ Online | 🏢 On-Premise |
|---------|----------|---------------|
| Provider | Supabase Auth | Keycloak / LDAP / Local |
| User Store | Supabase | Keycloak DB / LDAP / PostgreSQL |
| Password Reset | Supabase Email | Keycloak / Custom SMTP |
| Social Login | ✅ Google, GitHub | Optional (Keycloak) |
| SSO/SAML | ❌ (Enterprise) | ✅ Keycloak supports |
| MFA | ✅ Supabase | ✅ Keycloak |

### Frontend Tasks

#### Auth Provider Abstraction
- [ ] Create `src/lib/auth/AuthProvider.ts` (interface)
- [ ] Create `src/lib/auth/supabase.ts` (Online)
- [ ] Create `src/lib/auth/keycloak.ts` (On-Premise)
- [ ] Create `src/lib/auth/local.ts` (Simple On-Premise)

#### Auth Context
- [ ] Create `src/contexts/AuthContext.tsx`:
  - [ ] Uses abstract AuthProvider
  - [ ] Session state management
  - [ ] User profile with role
  - [ ] Login/logout/register methods
  - [ ] Loading state

#### Auth Pages
- [ ] Create `src/screens/auth/LoginPage.tsx`:
  - [ ] Email/password form
  - [ ] "Remember me" checkbox
  - [ ] Forgot password link
  - [ ] Social login buttons (Online only, feature flag)
  - [ ] SSO button (On-Premise with Keycloak)
  - [ ] Error handling
  - [ ] Redirect after login based on role

- [ ] Create `src/screens/auth/RegisterPage.tsx`:
  - [ ] Email, password, confirm password
  - [ ] Full name
  - [ ] Organization name (for clients)
  - [ ] Terms & conditions checkbox
  - [ ] Self-registration toggle (on-prem may disable)

- [ ] Create `src/screens/auth/ForgotPasswordPage.tsx`
- [ ] Create `src/screens/auth/ResetPasswordPage.tsx`

#### Keycloak Integration (On-Premise)
```typescript
// frontend/src/lib/auth/keycloak.ts
import Keycloak from 'keycloak-js';
import { config } from '@/config/environment';

class KeycloakAuthProvider implements AuthProvider {
  private keycloak: Keycloak;
  
  constructor() {
    this.keycloak = new Keycloak({
      url: config.keycloakUrl,
      realm: config.keycloakRealm,
      clientId: config.keycloakClientId,
    });
  }
  
  async init(): Promise<boolean> {
    return this.keycloak.init({ 
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
    });
  }
  
  async signIn(): Promise<void> {
    return this.keycloak.login();
  }
  
  async signOut(): Promise<void> {
    return this.keycloak.logout();
  }
  
  getToken(): string | undefined {
    return this.keycloak.token;
  }
  
  async refreshToken(): Promise<boolean> {
    return this.keycloak.updateToken(30);
  }
}
```

#### Protected Routes
- [ ] Create `src/components/ProtectedRoute.tsx`
- [ ] Create `src/components/RoleGuard.tsx`
- [ ] Update router with role-based redirects

#### Layout Updates
- [ ] Update `Layout.tsx`:
  - [ ] Show user info (name, avatar, role badge)
  - [ ] Role-based navigation menu
  - [ ] Logout button
  - [ ] Organization switcher (if multi-org)
  - [ ] Mode indicator (dev only)

### Backend Tasks

#### Auth Middleware (Adapter-based)
- [ ] Create `app/auth/dependencies.py`:
  - [ ] `get_auth_adapter()` - returns configured adapter
  - [ ] `get_current_user` - verify token via adapter
  - [ ] `require_role(*roles)` - role checker
  - [ ] `get_optional_user` - for public endpoints

```python
# backend/app/auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.services.factory import get_auth_adapter

security = HTTPBearer()

async def get_current_user(token = Depends(security)):
    auth = get_auth_adapter()
    user = await auth.verify_token(token.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

def require_role(*roles):
    async def checker(user = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker
```

#### Keycloak Adapter (On-Premise)
```python
# backend/app/adapters/auth/keycloak.py
from keycloak import KeycloakOpenID
from app.adapters.auth import AuthAdapter

class KeycloakAuthAdapter(AuthAdapter):
    def __init__(self, url: str, realm: str, client_id: str, client_secret: str):
        self.keycloak = KeycloakOpenID(
            server_url=url,
            realm_name=realm,
            client_id=client_id,
            client_secret_key=client_secret
        )
    
    async def verify_token(self, token: str) -> Optional[User]:
        try:
            token_info = self.keycloak.introspect(token)
            if not token_info.get('active'):
                return None
            
            user_info = self.keycloak.userinfo(token)
            return User(
                id=user_info['sub'],
                email=user_info['email'],
                full_name=user_info.get('name', user_info['email']),
                role=self._extract_role(token_info),
            )
        except Exception:
            return None
    
    def _extract_role(self, token_info: dict) -> str:
        # Extract role from Keycloak realm roles
        roles = token_info.get('realm_access', {}).get('roles', [])
        if 'admin' in roles:
            return 'admin'
        elif 'labeler' in roles:
            return 'labeler'
        return 'client'
```

#### LDAP Adapter (Enterprise On-Premise)
```python
# backend/app/adapters/auth/ldap.py
from ldap3 import Server, Connection, ALL
from app.adapters.auth import AuthAdapter

class LDAPAuthAdapter(AuthAdapter):
    def __init__(self, url: str, base_dn: str, bind_dn: str, bind_password: str):
        self.server = Server(url, get_info=ALL)
        self.base_dn = base_dn
        self.bind_dn = bind_dn
        self.bind_password = bind_password
    
    async def authenticate(self, username: str, password: str) -> Optional[User]:
        # Bind with user credentials
        user_dn = f"cn={username},{self.base_dn}"
        conn = Connection(self.server, user_dn, password)
        
        if not conn.bind():
            return None
        
        # Get user attributes
        conn.search(user_dn, '(objectClass=*)', attributes=['cn', 'mail', 'memberOf'])
        entry = conn.entries[0]
        
        return User(
            id=str(entry.entry_dn),
            email=str(entry.mail),
            full_name=str(entry.cn),
            role=self._extract_role_from_groups(entry.memberOf),
        )
```

#### User Endpoints
- [ ] `GET /api/users` - list users (admin only)
- [ ] `GET /api/users/:id` - get user details
- [ ] `PUT /api/users/:id` - update user
- [ ] `DELETE /api/users/:id` - deactivate (admin)
- [ ] `POST /api/users/invite` - invite user (Online uses email, On-Prem uses Keycloak API)

#### Organization Endpoints
- [ ] `GET /api/organizations` - list
- [ ] `POST /api/organizations` - create
- [ ] `GET /api/organizations/:id` - details
- [ ] `PUT /api/organizations/:id` - update
- [ ] `POST /api/organizations/:id/members` - add member
- [ ] `DELETE /api/organizations/:id/members/:userId` - remove

### Email Templates

**Online (Supabase Dashboard):**
- [ ] Customize confirmation email with branding
- [ ] Customize password reset email
- [ ] Customize invite email

**On-Premise (Keycloak or Custom SMTP):**
- [ ] Configure Keycloak email templates
- [ ] Or create custom email templates in backend
- [ ] Configure SMTP settings

### Completion Criteria

**Both Modes:**
- [ ] Users can login/logout
- [ ] Session persists across refresh
- [ ] Protected routes work
- [ ] Role-based navigation works
- [ ] Backend validates tokens

**Online Mode:**
- [ ] Users can register with email
- [ ] Email verification works
- [ ] Password reset works
- [ ] Social login works (optional)

**On-Premise Mode:**
- [ ] Keycloak SSO works
- [ ] Or LDAP authentication works
- [ ] Or local username/password works
- [ ] User provisioning via Keycloak admin

### Notes

_Add implementation notes here_

---

## Phase 2: Client Portal

**Status:** ⬜ Not Started  
**Estimated Duration:** 1 week  
**Dependencies:** Phase 1  
**Priority:** 🟡 High  

### Storage Strategy by Mode

| Feature | ☁️ Online | 🏢 On-Premise |
|---------|----------|---------------|
| Upload To | Supabase Storage | MinIO / Local FS |
| Download From | Signed URLs | Direct serve / MinIO |
| CDN | Supabase CDN | Nginx / Customer CDN |
| Max File Size | 50MB (free tier) | Configurable |
| Virus Scan | Optional (external) | Customer's solution |

### Backend Tasks

#### Storage Adapter Usage
```python
# backend/app/routers/documents.py
from app.services.factory import get_storage_adapter

@router.post("/upload")
async def upload_document(
    file: UploadFile,
    user: User = Depends(get_current_user),
    storage = Depends(get_storage_adapter)
):
    # Same code works for Supabase, MinIO, or local
    path = f"documents/{user.organization_id}/{uuid4()}/{file.filename}"
    url = await storage.upload(path, await file.read(), file.content_type)
    
    # Save to database
    doc = await create_document(
        original_name=file.filename,
        file_path=path,
        uploaded_by=user.id,
        organization_id=user.organization_id
    )
    return doc
```

#### Document Endpoints Update
- [ ] Update `POST /api/upload`:
  - [ ] Require authentication
  - [ ] Use storage adapter (works for all backends)
  - [ ] Set `uploaded_by` from JWT
  - [ ] Set `organization_id` from user's org
  - [ ] File type & size validation (configurable limits)

- [ ] Update `GET /api/documents`:
  - [ ] Filter by user's organization
  - [ ] Pagination
  - [ ] Sorting, filtering, search

- [ ] Add `DELETE /api/documents/:id`:
  - [ ] Soft delete in DB
  - [ ] Optionally delete from storage (configurable)

- [ ] Add `GET /api/documents/:id/download`:
  - [ ] Generate signed URL (Online: Supabase, On-Prem: MinIO)
  - [ ] Or stream directly (On-Prem: Local FS)

#### Client Stats Endpoint
- [ ] Create `GET /api/client/stats`:
  - [ ] Total documents
  - [ ] By status
  - [ ] Processing times
  - [ ] Storage used

### Frontend Tasks

#### Client Dashboard
- [ ] Create `src/screens/client/ClientDashboard.tsx`:
  - [ ] Welcome message
  - [ ] Stats cards
  - [ ] Recent documents
  - [ ] Processing timeline chart
  - [ ] Quick upload button
  - [ ] Storage quota display (Online mode)

#### Client Document List
- [ ] Create `src/screens/client/ClientDocuments.tsx`:
  - [ ] Paginated table
  - [ ] Search & filter
  - [ ] Sort options
  - [ ] Bulk delete
  - [ ] Export CSV

#### Document View (Read-only)
- [ ] Create `src/screens/client/ClientDocumentView.tsx`:
  - [ ] PDF viewer
  - [ ] Extracted data (read-only)
  - [ ] Processing history
  - [ ] Download options

#### Upload Improvements
- [ ] Multi-file upload with progress
- [ ] Drag and drop
- [ ] Cancel upload
- [ ] Upload queue
- [ ] Resume failed uploads (chunked, On-Prem)

#### Organization Settings
- [ ] Create `src/screens/client/OrganizationSettings.tsx`:
  - [ ] Org details
  - [ ] Invite team members
  - [ ] Manage members
  - [ ] Billing info (Online only, feature flag)
  - [ ] Storage quota (Online only)

### Additional Features

- [ ] Document folders/categories
- [ ] Tags for documents
- [ ] Favorites/starred documents
- [ ] Document comments/notes
- [ ] Shareable links (temporary, configurable expiry)

### On-Premise Specific

- [ ] Local file browser integration (optional)
- [ ] Batch upload from network folder
- [ ] Watch folder auto-import
- [ ] Integration with customer's DMS

### Completion Criteria

**Both Modes:**
- [ ] Clients see only their org's documents
- [ ] Upload tracks uploader
- [ ] Multi-file upload works
- [ ] Dashboard shows stats
- [ ] Search and filter work
- [ ] Can invite team members

**Online Mode:**
- [ ] Supabase Storage works
- [ ] Storage quota displayed

**On-Premise Mode:**
- [ ] MinIO/Local storage works
- [ ] Large file uploads work
- [ ] No external dependencies

### Notes

_Add implementation notes here_

---

## Phase 3: Labeler Workspace

**Status:** ⬜ Not Started  
**Estimated Duration:** 2 weeks  
**Dependencies:** Phase 1, Phase 2  
**Priority:** 🟡 High  

### OCR Strategy by Mode

| Feature | ☁️ Online | 🏢 On-Premise |
|---------|----------|---------------|
| OCR Engine | Azure Form Recognizer / AWS Textract | Tesseract / PaddleOCR |
| Processing | Cloud API | Local CPU/GPU |
| Languages | 100+ | Installed language packs |
| Accuracy | Very High | High (model dependent) |
| Cost | Per page | Included in license |
| Speed | Fast (cloud scale) | Depends on hardware |
| Air-Gapped | ❌ | ✅ |

### OCR Adapter Usage
```python
# backend/app/services/ocr_processor.py
from app.services.factory import get_ocr_adapter

async def process_document(document_id: str, file_path: str):
    ocr = get_ocr_adapter()
    storage = get_storage_adapter()
    
    # Download file
    file_bytes = await storage.download(file_path)
    
    # Process with configured OCR
    result = await ocr.process_document(file_bytes)
    
    # Save results
    await update_document(document_id, extracted_data=result)

# backend/app/adapters/ocr/tesseract.py
class TesseractOCRAdapter(OCRAdapter):
    """Fully offline OCR for on-premise deployments"""
    
    def __init__(self, tesseract_path: str, languages: list[str] = ['eng']):
        self.tesseract_path = tesseract_path
        self.languages = '+'.join(languages)
    
    async def process_document(self, file_bytes: bytes) -> dict:
        import pytesseract
        from pdf2image import convert_from_bytes
        
        # Convert PDF to images
        pages = convert_from_bytes(file_bytes)
        
        results = []
        for i, page in enumerate(pages):
            # OCR with layout analysis
            data = pytesseract.image_to_data(
                page, 
                lang=self.languages,
                output_type=pytesseract.Output.DICT,
                config='--psm 1'  # Auto page segmentation
            )
            results.append(self._format_result(data, i))
        
        return {"pages": results}

# backend/app/adapters/ocr/paddleocr.py  
class PaddleOCRAdapter(OCRAdapter):
    """GPU-accelerated offline OCR"""
    
    def __init__(self, use_gpu: bool = True):
        from paddleocr import PaddleOCR
        self.ocr = PaddleOCR(use_gpu=use_gpu, lang='en')
    
    async def process_document(self, file_bytes: bytes) -> dict:
        # High-accuracy OCR with table detection
        ...
```

### Backend Tasks

#### Assignment System
- [ ] `GET /api/labeler/queue` - assigned documents
- [ ] `GET /api/labeler/next` - next document
- [ ] `POST /api/labeler/claim/:id` - claim from pool

#### Labeling Session
- [ ] `POST /api/labeler/sessions/start` - start session
- [ ] `PUT /api/labeler/sessions/:id/heartbeat` - keep alive
- [ ] `POST /api/labeler/sessions/:id/save` - save progress
- [ ] `POST /api/labeler/sessions/:id/complete` - complete & approve
- [ ] `POST /api/labeler/sessions/:id/skip` - skip with reason

#### Labeler Stats
- [ ] `GET /api/labeler/stats` - personal stats
- [ ] `GET /api/labeler/history` - work history

#### Session Management
- [ ] Background job for abandoned session detection
- [ ] Auto-release after 30min timeout

### Frontend Tasks

#### Labeler Dashboard
- [ ] Create `src/screens/labeler/LabelerDashboard.tsx`:
  - [ ] Today's stats
  - [ ] Queue count
  - [ ] Start Working button
  - [ ] Time by DocType chart
  - [ ] Weekly performance
  - [ ] Earnings estimate (Online) / Hours tracked (On-Prem)

#### Labeler Queue
- [ ] Create `src/screens/labeler/LabelerQueue.tsx`:
  - [ ] Assigned documents list
  - [ ] Priority & due date
  - [ ] Client & DocType info
  - [ ] Start button

#### Labeler Workspace (Main Screen)
- [ ] Create `src/screens/labeler/LabelerWorkspace.tsx`:

  **Layout:**
  - [ ] Split view: PDF left, fields right
  - [ ] Adjustable split
  - [ ] Fullscreen mode

  **PDF Viewer:**
  - [ ] Page navigation (prev/next/goto)
  - [ ] Zoom & rotate
  - [ ] Field highlighting

  **Fields Panel:**
  - [ ] Header fields
  - [ ] Table/line items
  - [ ] Validation indicators
  - [ ] OCR value tooltip
  - [ ] Confidence scores

  **Timer:**
  - [ ] Session timer display
  - [ ] Target time indicator

  **Actions:**
  - [ ] Save draft (Ctrl+S)
  - [ ] Approve & Next (Ctrl+Enter)
  - [ ] Skip with reason
  - [ ] Flag for review

  **Keyboard Shortcuts:**
  - [ ] Tab - navigate fields
  - [ ] Ctrl+S - save
  - [ ] Ctrl+Enter - approve
  - [ ] Ctrl+Arrow - pages

  **Auto-save:**
  - [ ] Every 30 seconds
  - [ ] On field blur
  - [ ] Save indicator

#### Offline Support (On-Premise)
- [ ] Cache current document locally
- [ ] Queue saves if network fails
- [ ] Sync when connection restored
- [ ] Work offline indicator

#### Session Recovery
- [ ] Detect incomplete session on login
- [ ] Resume or abandon prompt
- [ ] localStorage backup

#### Labeler History
- [ ] Create `src/screens/labeler/LabelerHistory.tsx`

### Gamification (Optional - Configurable)

- [ ] Daily/weekly goals
- [ ] Streaks
- [ ] Achievement badges
- [ ] Leaderboard (opt-in, on-prem may disable)
- [ ] Performance tiers

### Completion Criteria

**Both Modes:**
- [ ] Queue displays assigned documents
- [ ] Multi-page navigation works
- [ ] Time tracking accurate
- [ ] Auto-save works
- [ ] Approve loads next document
- [ ] Skip with reason works
- [ ] Keyboard shortcuts work
- [ ] Session recovery works

**Online Mode:**
- [ ] Cloud OCR integration works
- [ ] Realtime updates via Supabase

**On-Premise Mode:**
- [ ] Tesseract/PaddleOCR works
- [ ] Offline caching works
- [ ] No cloud dependencies

### Notes

_Add implementation notes here_

---

## Phase 4: Admin Portal

**Status:** ⬜ Not Started  
**Estimated Duration:** 1-2 weeks  
**Dependencies:** Phase 1, Phase 2, Phase 3  
**Priority:** 🟡 High  

### Admin Features by Mode

| Feature | ☁️ Online | 🏢 On-Premise |
|---------|----------|---------------|
| User Management | In-app + Supabase | In-app + Keycloak Admin |
| Billing Dashboard | ✅ Full | ❌ License-based |
| Usage Tracking | ✅ Detailed | ✅ Simplified |
| System Settings | Limited | Full control |
| Backup/Restore | Supabase handles | Manual/Scripted |
| Updates | Automatic | Manual |

### Backend Tasks

#### Admin Stats
- [ ] `GET /api/admin/stats/overview` - system overview

#### User Management
- [ ] Full CRUD for users
- [ ] Activity logs per user
- [ ] Impersonation (careful! audit logged)
- [ ] User sync with Keycloak (On-Prem)

#### Organization Management
- [ ] Full CRUD for orgs
- [ ] Plan management (Online) / License management (On-Prem)

#### Document Assignment
- [ ] `GET /api/admin/assignments/unassigned`
- [ ] `POST /api/admin/assignments` - assign to labeler
- [ ] `POST /api/admin/assignments/auto` - auto-assign
- [ ] `PUT /api/admin/assignments/:id/reassign`

#### Billing (Online Mode)
- [ ] `GET /api/admin/billing/summary`
- [ ] `GET /api/admin/billing/labeler-payroll`
- [ ] `POST /api/admin/billing/generate-invoice`

#### License Management (On-Premise Mode)
```python
# backend/app/routers/admin/license.py
@router.get("/license")
async def get_license_info():
    """Get current license details"""
    return {
        "license_key": settings.LICENSE_KEY[:8] + "...",
        "type": "enterprise",  # starter, professional, enterprise
        "max_users": 50,
        "max_documents_per_month": 10000,
        "features": ["ocr", "labeling", "analytics", "api"],
        "expires_at": "2026-12-31",
        "is_valid": True,
    }

@router.post("/license/activate")
async def activate_license(license_key: str):
    """Activate or update license"""
    # Validate license (can be offline validation)
    ...
```

#### System Settings (On-Premise)
```python
@router.get("/system/settings")
async def get_system_settings():
    return {
        "ocr_provider": settings.OCR_PROVIDER,
        "storage_provider": settings.STORAGE_PROVIDER,
        "auth_provider": settings.AUTH_PROVIDER,
        "features": {
            "billing": settings.ENABLE_BILLING,
            "telemetry": settings.ENABLE_TELEMETRY,
        },
        "limits": {
            "max_file_size_mb": 100,
            "max_concurrent_ocr": 4,
        }
    }

@router.put("/system/settings")
async def update_system_settings(updates: dict):
    """Update system configuration (requires restart)"""
    ...
```

#### Backup & Maintenance (On-Premise)
```python
@router.post("/system/backup")
async def create_backup():
    """Create database and files backup"""
    # Export PostgreSQL dump
    # Archive storage files
    # Return download link
    ...

@router.post("/system/restore")
async def restore_backup(backup_file: UploadFile):
    """Restore from backup"""
    ...

@router.get("/system/health")
async def health_check():
    """Detailed health check for on-prem monitoring"""
    return {
        "status": "healthy",
        "database": await check_db(),
        "storage": await check_storage(),
        "ocr": await check_ocr(),
        "disk_usage": get_disk_usage(),
        "memory_usage": get_memory_usage(),
    }
```

### Frontend Tasks

#### Admin Dashboard
- [ ] Create `src/screens/admin/AdminDashboard.tsx`:
  - [ ] System overview cards
  - [ ] Real-time activity feed
  - [ ] Queue status
  - [ ] Active labelers
  - [ ] Alerts needing attention
  - [ ] System health (On-Prem)

#### User Management
- [ ] Create `src/screens/admin/AdminUsers.tsx`:
  - [ ] Users table
  - [ ] Inline role change
  - [ ] Activate/deactivate
  - [ ] Create user modal
  - [ ] User detail drawer
  - [ ] Link to Keycloak admin (On-Prem)

#### Organization Management
- [ ] Create `src/screens/admin/AdminOrganizations.tsx`

#### Document Overview
- [ ] Create `src/screens/admin/AdminDocuments.tsx`:
  - [ ] All documents
  - [ ] Advanced filters
  - [ ] Bulk assign
  - [ ] Bulk status change

#### Assignment Manager
- [ ] Create `src/screens/admin/AdminAssignments.tsx`:
  - [ ] Unassigned queue
  - [ ] Labeler workloads
  - [ ] Drag-and-drop assign
  - [ ] Auto-assign button

#### Billing Dashboard (Online Only)
- [ ] Create `src/screens/admin/AdminBilling.tsx`:
  - [ ] Revenue by client
  - [ ] Labeler costs
  - [ ] Profit margins
  - [ ] Invoice generation
  - [ ] Payment tracking
  - [ ] Wrap in feature flag check

#### License Management (On-Premise Only)
- [ ] Create `src/screens/admin/AdminLicense.tsx`:
  - [ ] Current license info
  - [ ] Usage vs limits
  - [ ] License activation
  - [ ] Expiry warnings

#### System Settings (On-Premise Only)
- [ ] Create `src/screens/admin/AdminSystem.tsx`:
  - [ ] Configuration display
  - [ ] Health status
  - [ ] Backup/Restore buttons
  - [ ] Service status (DB, Storage, OCR)
  - [ ] Logs viewer
  - [ ] Update checker

#### Audit Log Viewer
- [ ] Create `src/screens/admin/AdminAuditLog.tsx`

### Completion Criteria

**Both Modes:**
- [ ] See all system stats
- [ ] Manage users
- [ ] Manage organizations
- [ ] Assign documents
- [ ] View audit logs

**Online Mode:**
- [ ] View billing
- [ ] Generate invoices
- [ ] Usage-based pricing visible

**On-Premise Mode:**
- [ ] License info displayed
- [ ] System health visible
- [ ] Backup/Restore works
- [ ] No billing dependencies

### Notes

_Add implementation notes here_

---

## Phase 5: Analytics & Reporting

**Status:** ⬜ Not Started  
**Estimated Duration:** 1-2 weeks  
**Dependencies:** Phase 3, Phase 4  
**Priority:** 🟢 Medium  

### Backend Tasks

#### Analytics Endpoints
- [ ] `GET /api/analytics/labeler/:id`
- [ ] `GET /api/analytics/client/:orgId`
- [ ] `GET /api/analytics/system`
- [ ] `GET /api/analytics/time-tracking`

#### Report Generation
- [ ] Install ReportLab/WeasyPrint
- [ ] `POST /api/reports/generate`
- [ ] `GET /api/reports/:id`
- [ ] `GET /api/reports`

- [ ] Report templates:
  - [ ] Labeler performance
  - [ ] Client usage
  - [ ] Admin summary
  - [ ] Billing invoice
  - [ ] Payroll report

### Frontend Tasks

#### Charts
- [ ] Install recharts
- [ ] Create chart wrapper components

#### Dashboard Charts

**Labeler:**
- [ ] Documents/day
- [ ] Time by DocType
- [ ] Weekly trend
- [ ] Client distribution

**Client:**
- [ ] Upload history
- [ ] Status distribution
- [ ] Processing time trend
- [ ] Labeler contributions

**Admin:**
- [ ] System throughput
- [ ] Queue depth
- [ ] Labeler utilization
- [ ] Revenue by client

#### Reports Page
- [ ] Create `src/screens/shared/ReportsPage.tsx`:
  - [ ] Report type selector
  - [ ] Date range picker
  - [ ] Generate button
  - [ ] Reports list
  - [ ] Download links

#### Export Options
- [ ] Table to CSV
- [ ] Chart to PNG
- [ ] Print-friendly views

### Report Types

| Report | For | Contents |
|--------|-----|----------|
| Labeler Summary | Labeler | Hours, docs, earnings |
| Client Summary | Client | Uploads, costs, labelers |
| Admin Summary | Admin | All metrics |
| Billing Invoice | Client | Charges |
| Payroll Report | Admin | Labeler payments |

### Completion Criteria

- [ ] Dashboards have charts
- [ ] PDF reports generate
- [ ] Time tracking accurate
- [ ] Billing calculations correct
- [ ] CSV export works

### Notes

_Add implementation notes here_

---

## Phase 6: Notifications & Communication

**Status:** ⬜ Not Started  
**Estimated Duration:** 3-5 days  
**Dependencies:** Phase 1  
**Priority:** 🟢 Medium  

### Notification Strategy by Mode

| Feature | ☁️ Online | 🏢 On-Premise |
|---------|----------|---------------|
| In-App | ✅ Both | ✅ Both |
| Email | SendGrid / Resend | SMTP / Local Mail Server |
| Realtime | Supabase Realtime | WebSockets / Polling |
| Push (Mobile) | Firebase FCM | ❌ or self-hosted |

### Backend Tasks

#### Notification System
- [ ] `GET /api/notifications`
- [ ] `PUT /api/notifications/:id/read`
- [ ] `PUT /api/notifications/read-all`
- [ ] Notification service functions

#### Email Adapter
```python
# backend/app/adapters/email/__init__.py
class EmailAdapter(ABC):
    @abstractmethod
    async def send(self, to: str, subject: str, body: str, html: str = None) -> bool:
        pass

# backend/app/adapters/email/sendgrid.py
class SendGridEmailAdapter(EmailAdapter):
    # For online mode
    ...

# backend/app/adapters/email/smtp.py
class SMTPEmailAdapter(EmailAdapter):
    """For on-premise with customer's mail server"""
    def __init__(self, host: str, port: int, user: str, password: str):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
    
    async def send(self, to: str, subject: str, body: str, html: str = None) -> bool:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.user
        msg['To'] = to
        
        msg.attach(MIMEText(body, 'plain'))
        if html:
            msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(self.host, self.port) as server:
            server.starttls()
            server.login(self.user, self.password)
            server.send_message(msg)
        
        return True

# backend/app/adapters/email/none.py
class NoOpEmailAdapter(EmailAdapter):
    """For air-gapped deployments with no email"""
    async def send(self, *args, **kwargs) -> bool:
        return True  # Silently succeed
```

#### Email Notifications
- [ ] Configure email provider via adapter
- [ ] Email templates:
  - [ ] Document processed
  - [ ] Assignment notification
  - [ ] Weekly summary
  - [ ] Invoice ready (Online only)

#### Realtime Adapter
```python
# backend/app/adapters/realtime/__init__.py
class RealtimeAdapter(ABC):
    @abstractmethod
    async def broadcast(self, channel: str, event: str, data: dict):
        pass

# backend/app/adapters/realtime/supabase.py
class SupabaseRealtimeAdapter(RealtimeAdapter):
    # Uses Supabase Realtime channels
    ...

# backend/app/adapters/realtime/websocket.py
class WebSocketRealtimeAdapter(RealtimeAdapter):
    """For on-premise without Supabase"""
    # Uses FastAPI WebSocket
    ...
```

#### Realtime
- [ ] Abstract realtime with adapter pattern
- [ ] Online: Supabase Realtime subscriptions
- [ ] On-Prem: WebSocket implementation or polling fallback

### Frontend Tasks

#### Notification Bell
- [ ] Create `src/components/NotificationBell.tsx`:
  - [ ] Unread count
  - [ ] Dropdown list
  - [ ] Mark as read
  - [ ] Real-time updates (adapter-based)

#### Realtime Abstraction
```typescript
// frontend/src/lib/realtime/index.ts
export interface RealtimeProvider {
  subscribe(channel: string, callback: (data: any) => void): () => void;
}

// Implementations: supabase.ts, websocket.ts, polling.ts
```

#### Notifications Page
- [ ] Create `src/screens/shared/NotificationsPage.tsx`

#### User Preferences
- [ ] Email frequency settings
- [ ] Notification type toggles
- [ ] Do not disturb (On-Prem: may be disabled if no email)

### Notification Types

| Event | Admin | Client | Labeler |
|-------|-------|--------|---------|
| Document uploaded | ✅ | ✅ | - |
| Document processed | ✅ | ✅ | - |
| Document assigned | ✅ | - | ✅ |
| Document approved | ✅ | ✅ | - |
| New user joined | ✅ | ✅ | - |
| Payment received | ✅ (Online) | ✅ (Online) | - |
| Payroll ready | ✅ (Online) | - | ✅ (Online) |
| License expiring | ✅ (On-Prem) | - | - |
| System alert | ✅ (On-Prem) | - | - |

### Completion Criteria

**Both Modes:**
- [ ] In-app notifications work
- [ ] Preferences configurable

**Online Mode:**
- [ ] Email notifications send (SendGrid)
- [ ] Supabase Realtime works

**On-Premise Mode:**
- [ ] SMTP email works (or gracefully disabled)
- [ ] WebSocket/Polling realtime works
- [ ] Works without internet

### Notes

_Add implementation notes here_

---

## Phase 7: On-Premise Packaging

**Status:** ⬜ Not Started  
**Estimated Duration:** 1 week  
**Dependencies:** Phases 0-6  
**Priority:** 🟢 Medium  

### Goal
Create a complete, easy-to-deploy on-premise package that customers can run in their own data centers with minimal setup.

### Docker Images

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

# Install system dependencies for OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    poppler-utils \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/

ENV DEPLOYMENT_MODE=onpremise

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Build args for configuration
ARG VITE_DEPLOYMENT_MODE=onpremise
ARG VITE_API_URL=http://localhost:8000
ARG VITE_AUTH_PROVIDER=keycloak

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Complete Docker Compose Stack

```yaml
# docker-compose.onpremise.yml (complete)
version: '3.8'

services:
  # ===================
  # REVERSE PROXY
  # ===================
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8081:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/certs:/certs
    restart: unless-stopped

  # ===================
  # DATABASE
  # ===================
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: docprocessing
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ===================
  # AUTHENTICATION
  # ===================
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: ${DB_PASSWORD:-changeme}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:-admin}
      KC_PROXY: edge
      KC_HOSTNAME_STRICT: false
    command: start
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.keycloak.rule=PathPrefix(`/auth`)"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ===================
  # FILE STORAGE
  # ===================
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.minio-console.rule=PathPrefix(`/minio`)"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # ===================
  # BACKEND API
  # ===================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DEPLOYMENT_MODE: onpremise
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-changeme}@postgres:5432/docprocessing
      AUTH_PROVIDER: keycloak
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_REALM: docprocessing
      KEYCLOAK_CLIENT_ID: backend
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET}
      STORAGE_PROVIDER: minio
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      S3_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
      OCR_PROVIDER: tesseract
      EMAIL_PROVIDER: smtp
      SMTP_HOST: ${SMTP_HOST:-mailhog}
      SMTP_PORT: ${SMTP_PORT:-1025}
      ENABLE_BILLING: false
      ENABLE_TELEMETRY: false
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=PathPrefix(`/api`)"
      - "traefik.http.services.backend.loadbalancer.server.port=8000"
    depends_on:
      postgres:
        condition: service_healthy
      keycloak:
        condition: service_started
      minio:
        condition: service_healthy
    restart: unless-stopped

  # ===================
  # FRONTEND
  # ===================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_DEPLOYMENT_MODE: onpremise
        VITE_API_URL: /api
        VITE_AUTH_PROVIDER: keycloak
        VITE_KEYCLOAK_URL: /auth
        VITE_KEYCLOAK_REALM: docprocessing
        VITE_KEYCLOAK_CLIENT_ID: frontend
        VITE_FEATURE_BILLING: false
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=PathPrefix(`/`)"
      - "traefik.http.routers.frontend.priority=1"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
    depends_on:
      - backend
    restart: unless-stopped

  # ===================
  # OPTIONAL: LOCAL EMAIL (dev/testing)
  # ===================
  mailhog:
    image: mailhog/mailhog
    profiles: ["dev"]
    ports:
      - "8025:8025"
    restart: unless-stopped

  # ===================
  # OPTIONAL: GPU OCR
  # ===================
  paddleocr:
    image: paddlepaddle/paddle:2.5.1-gpu-cuda11.7-cudnn8.4
    profiles: ["gpu"]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./ocr-service:/app
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

### Installation Script

```bash
#!/bin/bash
# install.sh - On-Premise Installer

set -e

echo "========================================"
echo "DocProcessing On-Premise Installer"
echo "========================================"

# Check requirements
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# Create directories
mkdir -p config backups logs

# Generate secrets if not exist
if [ ! -f .env ]; then
    echo "Generating configuration..."
    cat > .env << EOF
DB_PASSWORD=$(openssl rand -base64 32)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 32)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=$(openssl rand -base64 32)
LICENSE_KEY=TRIAL-$(date +%Y%m%d)
EOF
    echo "Created .env file with generated secrets"
fi

# Pull images
echo "Pulling Docker images..."
docker-compose -f docker-compose.onpremise.yml pull

# Initialize database
echo "Initializing database..."
docker-compose -f docker-compose.onpremise.yml up -d postgres
sleep 10
docker-compose -f docker-compose.onpremise.yml exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/init.sql

# Start all services
echo "Starting services..."
docker-compose -f docker-compose.onpremise.yml up -d

echo "========================================"
echo "Installation complete!"
echo "Access the application at: http://localhost"
echo "Keycloak Admin: http://localhost/auth"
echo "MinIO Console: http://localhost/minio"
echo "========================================"
```

### Air-Gapped Installation

For networks without internet access:

```bash
#!/bin/bash
# export-images.sh - Run on internet-connected machine

# Export all images to tar
docker save \
    postgres:15-alpine \
    quay.io/keycloak/keycloak:23.0 \
    minio/minio:latest \
    traefik:v2.10 \
    -o docprocessing-images.tar

# Build and export custom images
docker-compose build
docker save docprocessing-backend docprocessing-frontend -o docprocessing-custom.tar

echo "Transfer these files to air-gapped network:"
echo "- docprocessing-images.tar"
echo "- docprocessing-custom.tar"
echo "- docker-compose.onpremise.yml"
echo "- .env.template"
echo "- scripts/"
```

```bash
#!/bin/bash
# import-images.sh - Run on air-gapped machine

docker load -i docprocessing-images.tar
docker load -i docprocessing-custom.tar

# Then run install.sh as normal
```

### Documentation Package

- [ ] `docs/INSTALLATION.md` - Step-by-step installation
- [ ] `docs/CONFIGURATION.md` - All environment variables
- [ ] `docs/KEYCLOAK_SETUP.md` - SSO/LDAP integration
- [ ] `docs/BACKUP_RESTORE.md` - Backup procedures
- [ ] `docs/UPGRADE.md` - Version upgrade process
- [ ] `docs/TROUBLESHOOTING.md` - Common issues
- [ ] `docs/API_REFERENCE.md` - API documentation

### Licensing System

```python
# backend/app/license/validator.py
import hashlib
import json
from datetime import datetime
from cryptography.fernet import Fernet

class LicenseValidator:
    def __init__(self, public_key: str):
        self.public_key = public_key
    
    def validate(self, license_key: str) -> dict:
        """
        Validate license key (works offline)
        License contains encrypted JSON with:
        - customer_id
        - max_users
        - max_documents_per_month
        - features: list
        - expires_at: date
        """
        try:
            decoded = self._decode_license(license_key)
            
            if datetime.fromisoformat(decoded['expires_at']) < datetime.now():
                return {"valid": False, "error": "License expired"}
            
            return {
                "valid": True,
                "customer": decoded['customer_id'],
                "limits": {
                    "users": decoded['max_users'],
                    "documents": decoded['max_documents_per_month'],
                },
                "features": decoded['features'],
                "expires_at": decoded['expires_at'],
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
```

### Health Monitoring

```yaml
# prometheus/prometheus.yml (optional)
scrape_configs:
  - job_name: 'docprocessing'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics
```

### Completion Criteria

- [ ] Single `docker-compose up` starts everything
- [ ] Installation script works
- [ ] Air-gapped installation works
- [ ] Documentation complete
- [ ] Backup/Restore scripts work
- [ ] Upgrade path documented
- [ ] License validation works offline
- [ ] Health checks pass

### Notes

_Add implementation notes here_

---

## Phase 8: Polish & Production

**Status:** ⬜ Not Started  
**Estimated Duration:** 1 week  
**Dependencies:** All previous  
**Priority:** 🟢 Medium  

### UX Polish

- [ ] Loading states (skeletons, spinners)
- [ ] Empty states
- [ ] Error states (404, 403, 500)
- [ ] Form validation messages
- [ ] Toast notifications
- [ ] Confirmation dialogs
- [ ] Accessibility (keyboard, screen reader)
- [ ] Mobile responsiveness
- [ ] Dark mode (optional)

### Performance

- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle analysis
- [ ] Database query optimization
- [ ] Response compression
- [ ] Caching (Redis for on-prem)

### Security

- [ ] Session timeout
- [ ] Rate limiting
- [ ] Input validation
- [ ] File type validation
- [ ] Audit logging
- [ ] Security headers
- [ ] CORS configuration
- [ ] SQL injection prevention
- [ ] XSS prevention

### Testing

- [ ] Unit tests (backend)
- [ ] Component tests (frontend)
- [ ] Integration tests
- [ ] E2E tests (critical flows)
- [ ] Load testing
- [ ] Security scanning

### Documentation

- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guides (per role)
- [ ] Admin guide
- [ ] Developer setup guide
- [ ] Deployment guide (Online)
- [ ] Deployment guide (On-Premise)
- [ ] API integration guide

### Deployment - Online Mode (SaaS)

- [ ] Production Supabase project
- [ ] Environment variables
- [ ] Vercel/Netlify for frontend
- [ ] Railway/Render for backend
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Backup configuration (Supabase handles)
- [ ] SSL certificates (automatic)

### Deployment - On-Premise Mode

- [ ] Docker images versioned and tagged
- [ ] docker-compose.yml finalized
- [ ] Installation script tested
- [ ] Air-gapped package ready
- [ ] Self-hosted Sentry (GlitchTip)
- [ ] Prometheus + Grafana monitoring
- [ ] Backup cron jobs
- [ ] SSL certificate management (Let's Encrypt / customer certs)
- [ ] Update checker (phones home or manual)

### Deployment Comparison

| Aspect | ☁️ Online | 🏢 On-Premise |
|--------|----------|---------------|
| Frontend | Vercel/Netlify CDN | Nginx in Docker |
| Backend | Railway/Render | Docker container |
| Database | Supabase | PostgreSQL in Docker |
| SSL | Automatic | Traefik + Let's Encrypt |
| Updates | CI/CD auto-deploy | Manual docker pull |
| Monitoring | Sentry + UptimeRobot | Prometheus + Grafana |
| Backups | Supabase automatic | Scripted pg_dump |
| Support | Online ticket system | On-site or remote |

### Launch Checklist - Online

- [ ] All features tested
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Support process defined
- [ ] Billing integration tested
- [ ] Terms of Service published
- [ ] Privacy Policy published

### Launch Checklist - On-Premise

- [ ] Installation tested on fresh VM
- [ ] Air-gapped installation tested
- [ ] License validation works
- [ ] Backup/Restore tested
- [ ] Upgrade path tested
- [ ] Documentation reviewed by customer
- [ ] Support contract signed
- [ ] Training completed
- [ ] Go-live support scheduled

### Notes

_Add implementation notes here_

- [ ] Production Supabase project
- [ ] Environment variables
- [ ] Dockerfile
- [ ] docker-compose
- [ ] CI/CD pipeline
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Backup configuration

### Launch Checklist

- [ ] All features tested
- [ ] Security audit passed
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Support process defined

### Notes

_Add implementation notes here_

---

## Technology Stack

### Backend
| Tech | Purpose | Mode |
|------|---------|------|
| FastAPI | API framework | Both |
| PostgreSQL | Database | Both |
| Python-Jose | JWT verification | Both |
| ReportLab | PDF generation | Both |
| Supabase Client | Auth, Storage, Realtime | ☁️ Online |
| python-keycloak | Keycloak integration | 🏢 On-Prem |
| ldap3 | LDAP/AD integration | 🏢 On-Prem |
| boto3/minio | S3-compatible storage | 🏢 On-Prem |
| pytesseract | Offline OCR | 🏢 On-Prem |
| paddleocr | GPU OCR | 🏢 On-Prem |

### Frontend
| Tech | Purpose | Mode |
|------|---------|------|
| React 18 | UI framework | Both |
| TypeScript | Type safety | Both |
| TailwindCSS | Styling | Both |
| React Router | Routing | Both |
| Recharts | Charts | Both |
| React Hook Form | Forms | Both |
| Supabase JS | Auth & data | ☁️ Online |
| keycloak-js | Keycloak auth | 🏢 On-Prem |

### Infrastructure - Online
| Tech | Purpose |
|------|---------|
| Supabase Cloud | Auth, DB, Storage, Realtime |
| Vercel/Netlify | Frontend hosting |
| Railway/Render | Backend hosting |
| GitHub Actions | CI/CD |
| Sentry | Error tracking |
| SendGrid | Email |

### Infrastructure - On-Premise
| Tech | Purpose |
|------|---------|
| Docker Compose | Container orchestration |
| Traefik | Reverse proxy & SSL |
| PostgreSQL | Database |
| Keycloak | Identity management |
| MinIO | S3-compatible storage |
| Prometheus | Metrics |
| Grafana | Dashboards |
| GlitchTip | Error tracking (self-hosted Sentry) |

---

## File Structure

```
DigitalDemo/
├── IMPLEMENTATION_PLAN.md
├── README.md
├── docker-compose.yml              # Online dev
├── docker-compose.onpremise.yml    # On-premise deployment
├── .env.online.example
├── .env.onpremise.example
│
├── backend/
│   ├── requirements.txt
│   ├── requirements-onprem.txt     # Additional for on-prem
│   ├── Dockerfile
│   ├── .env.local
│   └── app/
│       ├── main.py
│       ├── config.py               # Unified config with mode detection
│       ├── database.py
│       ├── adapters/               # Pluggable service adapters
│       │   ├── __init__.py
│       │   ├── auth/
│       │   │   ├── __init__.py     # AuthAdapter ABC
│       │   │   ├── supabase.py     # ☁️ Online
│       │   │   ├── keycloak.py     # 🏢 On-Prem
│       │   │   ├── ldap.py         # 🏢 On-Prem
│       │   │   └── local.py        # 🏢 On-Prem (simple)
│       │   ├── storage/
│       │   │   ├── __init__.py     # StorageAdapter ABC
│       │   │   ├── supabase.py     # ☁️ Online
│       │   │   ├── minio.py        # 🏢 On-Prem
│       │   │   └── local.py        # 🏢 On-Prem
│       │   ├── ocr/
│       │   │   ├── __init__.py     # OCRAdapter ABC
│       │   │   ├── azure.py        # ☁️ Online
│       │   │   ├── aws.py          # ☁️ Online
│       │   │   ├── tesseract.py    # 🏢 On-Prem
│       │   │   └── paddleocr.py    # 🏢 On-Prem
│       │   ├── email/
│       │   │   ├── __init__.py     # EmailAdapter ABC
│       │   │   ├── sendgrid.py     # ☁️ Online
│       │   │   ├── smtp.py         # 🏢 On-Prem
│       │   │   └── noop.py         # Air-gapped
│       │   └── realtime/
│       │       ├── __init__.py     # RealtimeAdapter ABC
│       │       ├── supabase.py     # ☁️ Online
│       │       └── websocket.py    # 🏢 On-Prem
│       ├── services/
│       │   └── factory.py          # Adapter factory
│       ├── auth/
│       ├── users/
│       ├── organizations/
│       ├── documents/
│       ├── labeling/
│       ├── analytics/
│       ├── reports/
│       ├── notifications/
│       └── license/                # 🏢 On-Prem only
│           └── validator.py
│
├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.local
│   └── src/
│       ├── config/
│       │   └── environment.ts      # Mode detection & feature flags
│       ├── lib/
│       │   ├── supabase.ts
│       │   ├── auth/               # Auth provider abstraction
│       │   │   ├── index.ts
│       │   │   ├── AuthProvider.ts
│       │   │   ├── supabase.ts     # ☁️ Online
│       │   │   ├── keycloak.ts     # 🏢 On-Prem
│       │   │   └── local.ts        # 🏢 On-Prem
│       │   └── realtime/           # Realtime abstraction
│       │       ├── index.ts
│       │       ├── supabase.ts     # ☁️ Online
│       │       └── websocket.ts    # 🏢 On-Prem
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── hooks/
│       │   └── useFeatureFlag.ts   # Check mode-specific features
│       ├── components/
│       │   ├── common/
│       │   ├── charts/
│       │   └── FeatureGate.tsx     # Conditional render by mode
│       └── screens/
│           ├── auth/
│           ├── client/
│           ├── labeler/
│           ├── admin/
│           │   ├── AdminBilling.tsx      # ☁️ Online only
│           │   ├── AdminLicense.tsx      # 🏢 On-Prem only
│           │   └── AdminSystem.tsx       # 🏢 On-Prem only
│           └── shared/
│
├── scripts/
│   ├── init.sql                    # Database schema
│   ├── install.sh                  # On-prem installer
│   ├── backup.sh                   # On-prem backup
│   ├── restore.sh                  # On-prem restore
│   ├── export-images.sh            # Air-gapped export
│   └── import-images.sh            # Air-gapped import
│
├── docs/
│   ├── INSTALLATION.md             # On-prem installation
│   ├── CONFIGURATION.md            # All env vars
│   ├── KEYCLOAK_SETUP.md           # SSO guide
│   ├── LDAP_INTEGRATION.md         # AD/LDAP guide
│   ├── BACKUP_RESTORE.md           # Backup procedures
│   ├── UPGRADE.md                  # Version upgrades
│   ├── TROUBLESHOOTING.md          # Common issues
│   └── API_REFERENCE.md            # API docs
│
└── deploy/
    ├── online/
    │   ├── vercel.json
    │   └── railway.toml
    └── onpremise/
        ├── docker-compose.yml
        ├── traefik/
        ├── prometheus/
        └── grafana/
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-07 | Use Supabase for Online | Faster auth, built-in features, PostgreSQL |
| 2025-12-07 | Support On-Premise | Enterprise clients need data sovereignty |
| 2025-12-07 | Adapter pattern for services | Same codebase for both modes |
| 2025-12-07 | Keycloak for On-Prem auth | Enterprise SSO, LDAP support |
| 2025-12-07 | MinIO for On-Prem storage | S3-compatible, easy migration |
| 2025-12-07 | Tesseract for On-Prem OCR | Fully offline, no cloud dependency |
| 2025-12-07 | Add Phase 7 for packaging | On-prem needs installer & docs |
| 2025-12-07 | Feature flags | Disable billing/telemetry for on-prem |
| | | |

---

## Blockers & Issues

| Date | Issue | Status | Resolution |
|------|-------|--------|------------|
| | | | |

---

## Pricing Strategy

### Online (SaaS)

| Plan | Price/Month | Documents | Users | Features |
|------|------------|-----------|-------|----------|
| **Free** | $0 | 50/month | 1 | Basic OCR |
| **Starter** | $49 | 500/month | 5 | + Analytics |
| **Professional** | $199 | 2,500/month | 20 | + API, Priority |
| **Enterprise** | Custom | Unlimited | Unlimited | + SSO, SLA |

### On-Premise

| License | Price | Support | Updates |
|---------|-------|---------|---------|
| **Starter** | $5,000/year | Email | 1 year |
| **Professional** | $15,000/year | Priority | 1 year |
| **Enterprise** | $50,000+/year | Dedicated | Perpetual |

_Note: On-prem includes all features, pricing based on support level._

---

## Updates

### December 7, 2025
- Initial planning complete
- Chose Supabase for Online auth
- Added On-Premise deployment mode
- 9 phases defined (0-8)
- Adapter pattern for all external services
- Docker Compose for on-prem
- Air-gapped installation support
- Keycloak/LDAP for enterprise auth
- Tesseract/PaddleOCR for offline OCR
- MinIO for on-prem storage
- License validation system
- Comprehensive file structure

---

## Quick Start

### Online Mode (Development)

```bash
# 1. Create Supabase project at supabase.com

# 2. Frontend setup
cd frontend
npm install
cp .env.online.example .env.local
# Edit .env.local with Supabase credentials

# 3. Backend setup
cd backend
pip install -r requirements.txt
cp .env.online.example .env.local
# Edit .env.local with Supabase credentials

# 4. Run SQL schema in Supabase SQL Editor

# 5. Start development
cd frontend && npm run dev
cd backend && uvicorn app.main:app --reload
```

### On-Premise Mode (Docker)

```bash
# 1. Clone repository
git clone https://github.com/yourorg/docprocessing.git
cd docprocessing

# 2. Configure
cp .env.onpremise.example .env
# Edit .env with your settings

# 3. Start everything
docker-compose -f docker-compose.onpremise.yml up -d

# 4. Access
# Application: http://localhost
# Keycloak Admin: http://localhost/auth (admin / from .env)
# MinIO Console: http://localhost:9001

# 5. Setup Keycloak realm (see docs/KEYCLOAK_SETUP.md)
```

### Air-Gapped Installation

```bash
# On internet-connected machine:
./scripts/export-images.sh
# Transfer files to air-gapped network

# On air-gapped machine:
./scripts/import-images.sh
./scripts/install.sh
```

---

## Mode Comparison Summary

| Aspect | ☁️ Online (SaaS) | 🏢 On-Premise |
|--------|-----------------|---------------|
| **Setup Time** | Minutes | Hours |
| **Maintenance** | Managed | Self-managed |
| **Updates** | Automatic | Manual |
| **Scaling** | Automatic | Manual |
| **Data Location** | Cloud | Customer's DC |
| **Compliance** | SOC2, GDPR | HIPAA, PCI, Air-gapped |
| **Cost** | Subscription | License |
| **Customization** | Limited | Full |
| **Support** | Standard | Dedicated |
| **Best For** | Startups, SMBs | Enterprise, Government |

---

_Last Updated: December 7, 2025_
