CREATE TABLE IF NOT EXISTS organizations (
    id              BIGSERIAL                      PRIMARY KEY,
    organization_id UUID                           UNIQUE   NOT NULL,
    name_en         VARCHAR(255)                   UNIQUE   NOT NULL,
    name_ar         VARCHAR(255)                   UNIQUE   NOT NULL,
    slug            VARCHAR(255)                   UNIQUE   NOT NULL,
    industry        VARCHAR(255)                            NOT NULL,
    updated_by      BIGINT                                          ,
    type            VARCHAR(255)                            NOT NULL,
    status          VARCHAR(255)                            NOT NULL,
    created_at      TIMESTAMP                      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP
);

CREATE INDEX idx_organization_id                  ON organizations(organization_id);
CREATE INDEX idx_organization_status              ON organizations(status);
CREATE INDEX idx_organization_type                ON organizations(type);
CREATE INDEX idx_organization_created_at          ON organizations(created_at);