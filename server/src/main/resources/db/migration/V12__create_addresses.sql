CREATE TABLE addresses (
    id                  UUID            PRIMARY KEY DEFAULT uuidv7(),
    organization_id     UUID            NOT NULL REFERENCES organizations(id),
    label               VARCHAR(100)    NOT NULL,
    street_line_1       VARCHAR(255)    NOT NULL,
    street_line_2       VARCHAR(255),
    city                VARCHAR(100)    NOT NULL,
    state_province      VARCHAR(100),
    postal_code         VARCHAR(20)     NOT NULL,
    country             VARCHAR(100)    NOT NULL DEFAULT 'Saudi Arabia',
    is_primary          BOOLEAN         NOT NULL DEFAULT false,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP
);

CREATE INDEX idx_addresses_organization_id ON addresses(organization_id);
CREATE UNIQUE INDEX idx_addresses_unique_primary ON addresses(organization_id) WHERE is_primary = true;
