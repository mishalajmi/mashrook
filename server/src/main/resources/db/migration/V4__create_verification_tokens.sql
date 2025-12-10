-- Migration V4: Create verification_tokens table for email verification and password reset
-- This table stores tokens for various user verification purposes

CREATE TABLE IF NOT EXISTS verification_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    token_type      VARCHAR(50) NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at         TIMESTAMP,

    CONSTRAINT fk_verification_tokens_user_id
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

-- Index for fast token lookup (most common query)
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);

-- Index for finding users tokens (e.g., to invalidate previous tokens)
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);

-- Index for token type filtering
CREATE INDEX idx_verification_tokens_type ON verification_tokens(token_type);

-- Composite index for finding valid tokens by user and type
CREATE INDEX idx_verification_tokens_user_type ON verification_tokens(user_id, token_type);

-- Partial index for unused tokens only (frequently queried)
CREATE INDEX idx_verification_tokens_unused ON verification_tokens(token) WHERE used_at IS NULL;

-- Index for cleanup of expired tokens
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);
