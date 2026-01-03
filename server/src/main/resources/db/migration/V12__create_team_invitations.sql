-- Migration V12: Create team_invitations table for team member invitations
-- This table stores pending invitations to join an organization with specific permissions

CREATE TABLE IF NOT EXISTS team_invitations (
    id                  UUID            PRIMARY KEY DEFAULT uuidv7(),
    organization_id     UUID            NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    invited_by          UUID            NOT NULL,
    token               VARCHAR(255)    NOT NULL    UNIQUE,
    permissions         JSONB           NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    expires_at          TIMESTAMP       NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at         TIMESTAMP,
    cancelled_at        TIMESTAMP,
    cancelled_by        UUID,

    CONSTRAINT fk_team_invitations_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_team_invitations_invited_by
    FOREIGN KEY (invited_by)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Index for fast token lookup (most common query for accepting invitations)
CREATE INDEX idx_team_invitations_token ON team_invitations(token);

-- Index for finding organization invitations
CREATE INDEX idx_team_invitations_org_id ON team_invitations(organization_id);

-- Index for finding invitations by email
CREATE INDEX idx_team_invitations_email ON team_invitations(email);

-- Unique constraint to prevent duplicate pending invitations for same org+email
CREATE UNIQUE INDEX idx_team_invitations_org_email_pending
ON team_invitations(organization_id, email)
WHERE status = 'PENDING';

-- Index for cleanup of expired invitations
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Partial index for pending invitations only (frequently queried)
CREATE INDEX idx_team_invitations_pending ON team_invitations(organization_id)
WHERE status = 'PENDING';
