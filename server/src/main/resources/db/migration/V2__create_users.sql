CREATE TABLE IF NOT EXISTS users (
    id              UUID                      PRIMARY KEY DEFAULT uuidv7(),
    organization_id UUID            NOT NULL,
    first_name      VARCHAR(255)    NOT NULL,
    last_name       VARCHAR(255)    NOT NULL,
    username        VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    status          VARCHAR(255)    NOT NULL DEFAULT 'INACTIVE',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT fk_users_organization_id
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_users_org_status ON users(organization_id, status);

CREATE INDEX idx_users_active ON users(email) WHERE status = 'ACTIVE';
