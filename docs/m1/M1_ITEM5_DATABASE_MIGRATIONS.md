# M1 Item #5: Secure Database / Migrations Evidence

## Current Database Implementation

### Development Implementation
- **Type**: In-memory Map storage
- **Location**: `lib/db.ts`
- **Data Structures**: 
  - `sessions` - Map of session records
  - `reports` - Map of report records
- **Status**: Functional for development and M1 functional testing

### Production Database Plan
- **Target**: Supabase PostgreSQL
- **Migration Strategy**: Planned for M2 implementation
- **Backup Strategy**: Supabase automated backups

## Database Schema Documentation

### Session Table Schema
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  email TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_modules TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Indexes for performance
CREATE INDEX idx_sessions_email ON sessions(email);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Report Table Schema
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}',
  band TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_band ON reports(band);
```

### Audit Log Table Schema
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Migration Scripts

### Migration 001: Initial Schema
```sql
-- Migration: 001_initial_schema.sql
-- Description: Create initial database schema for sessions and reports
-- Version: 1.0.0

BEGIN;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  email TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_modules TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  scores JSONB NOT NULL DEFAULT '{}',
  band TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_session_id ON reports(session_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_band ON reports(band);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

COMMIT;
```

### Migration 002: Add RLS Policies
```sql
-- Migration: 002_add_rls_policies.sql
-- Description: Add Row-Level Security policies
-- Version: 1.0.1

BEGIN;

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Session policies
CREATE POLICY "Users can view their own sessions" 
ON sessions FOR SELECT 
USING (id = auth.uid()::text OR email = auth.jwt()->>'email');

CREATE POLICY "Users can insert their own sessions" 
ON sessions FOR INSERT 
WITH CHECK (email = auth.jwt()->>'email');

CREATE POLICY "Users can update their own sessions" 
ON sessions FOR UPDATE 
USING (id = auth.uid()::text OR email = auth.jwt()->>'email');

-- Report policies
CREATE POLICY "Users can view their own reports" 
ON reports FOR SELECT 
USING (session_id IN (
  SELECT id FROM sessions WHERE email = auth.jwt()->>'email'
));

CREATE POLICY "Users can insert their own reports" 
ON reports FOR INSERT 
WITH CHECK (session_id IN (
  SELECT id FROM sessions WHERE email = auth.jwt()->>'email'
));

-- Audit log policies (read-only for users)
CREATE POLICY "Users can view their own audit logs" 
ON audit_logs FOR SELECT 
USING (session_id IN (
  SELECT id FROM sessions WHERE email = auth.jwt()->>'email'
));

-- Admin policies (for system administration)
CREATE POLICY "Admins can access all data" 
ON sessions FOR ALL 
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can access all reports" 
ON reports FOR ALL 
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can access all audit logs" 
ON audit_logs FOR ALL 
USING (auth.jwt()->>'role' = 'admin');

COMMIT;
```

## Current State Evidence

### In-Memory Implementation Status
- **File**: `lib/db.ts`
- **Data Structures**: 
  - `SessionRecord` interface defined
  - `ReportRecord` interface defined
  - CRUD operations implemented
- **Functionality**: ✅ All CRUD operations working
- **Session Management**: ✅ 15-minute expiry implemented
- **Data Persistence**: ⚠️ In-memory only (lost on restart)

### Database Migration Readiness
- **Schema Design**: ✅ Complete
- **Migration Scripts**: ✅ Prepared
- **RLS Policies**: ✅ Designed
- **Index Strategy**: ✅ Optimized
- **Backup Strategy**: ⚠️ Pending Supabase setup

## Applied State Evidence

### Development Environment
- **Current State**: In-memory Map storage
- **Data Loss**: Occurs on server restart
- **Purpose**: Development and M1 functional testing
- **Status**: ✅ Functional for M1 requirements

### Production Migration Plan
- **Target Database**: Supabase PostgreSQL
- **Migration Tool**: Supabase Migrations
- **Data Migration**: Script to transfer existing data
- **Testing Strategy**: Staging environment validation
- **Rollback Plan**: Database snapshots and migration reversibility

## Security Configuration

### Database Security
- **Connection**: Encrypted SSL/TLS
- **Authentication**: Supabase Auth integration
- **Authorization**: Row-Level Security (RLS)
- **Audit Logging**: Comprehensive audit trail
- **Backup**: Automated daily backups

### Session Security
- **Session IDs**: UUID generation
- **Expiry**: 15-minute automatic cleanup
- **Cleanup**: Scheduled job to remove expired sessions
- **Isolation**: User-specific data separation

## Outstanding Requirements for M1 Acceptance

### 1. Supabase Integration
**Required**: Actual Supabase database setup
**Action**: Create Supabase project and configure environment variables
**Timeline**: Can be completed within 1 business day

### 2. Migration Execution
**Required**: Execute migration scripts on Supabase
**Action**: Run migrations and verify schema
**Timeline**: Can be completed within 1 business day

### 3. Applied State Verification
**Required**: Evidence of successful migration execution
**Action**: Provide migration logs and schema verification
**Timeline**: Can be completed within 1 business day

## Conclusion

**Current Status**: ⚠️ PARTIAL - Schema and migrations designed, Supabase integration pending

**Functional Status**: ✅ In-memory implementation fulfills M1 functional requirements

**Readiness**: ✅ Complete migration plan ready for implementation

**Recommendation**: Proceed with Supabase integration for complete M1 database compliance.

---

**Document Version**: 1.0  
**Last Updated**: 2026-09-19  
**Status**: Ready for Implementation