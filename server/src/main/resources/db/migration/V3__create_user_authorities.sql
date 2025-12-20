CREATE TABLE IF NOT EXISTS user_authorities (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    user_id         UUID            NOT NULL,
    resource        VARCHAR(50)     NOT NULL,
    permission      VARCHAR(20)     NOT NULL,
    active          BOOLEAN         NOT NULL DEFAULT true,
    assigned_by     UUID,
    deactivated_by  UUID,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,
    deactivated_at  TIMESTAMP,

    CONSTRAINT fk_user_authorities_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_user_authorities_assigned_by
        FOREIGN KEY (assigned_by)
            REFERENCES users(id),

    CONSTRAINT fk_user_authorities_deactivated_by
        FOREIGN KEY (deactivated_by)
            REFERENCES users(id),

    CONSTRAINT uq_user_authorities_user_resource_permission_active
        UNIQUE (user_id, resource, permission, active)
);

CREATE INDEX idx_user_authorities_user_id
    ON user_authorities(user_id);

CREATE INDEX idx_user_authorities_resource
    ON user_authorities(resource);

CREATE INDEX idx_user_authorities_permission
    ON user_authorities(permission);

CREATE INDEX idx_user_authorities_active
    ON user_authorities(active)
    WHERE active = true;

CREATE INDEX idx_user_authorities_user_active
    ON user_authorities(user_id, active)
    WHERE active = true;

CREATE INDEX idx_user_authorities_resource_permission
    ON user_authorities(resource, permission);

CREATE INDEX idx_user_authorities_assigned_by
    ON user_authorities(assigned_by)
    WHERE assigned_by IS NOT NULL;
