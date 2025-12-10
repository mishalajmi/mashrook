CREATE TABLE IF NOT EXISTS user_roles (
                            id              BIGSERIAL       PRIMARY KEY,
                            user_id         BIGINT          NOT NULL,
                            role            VARCHAR(255)    NOT NULL,
                            active          BOOLEAN         NOT NULL DEFAULT true,
                            assigned_by     BIGINT,
                            deactivated_by  BIGINT,
                            created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at      TIMESTAMP,
                            deactivated_at  TIMESTAMP,

                            CONSTRAINT fk_user_roles_user
                                FOREIGN KEY (user_id)
                                    REFERENCES users(id),

                            CONSTRAINT fk_user_roles_assigned_by
                                FOREIGN KEY (assigned_by)
                                    REFERENCES users(id),

                            CONSTRAINT fk_user_roles_deactivated_by
                                FOREIGN KEY (deactivated_by)
                                    REFERENCES users(id),

                            -- Prevent duplicate active roles for the same user
                            CONSTRAINT uq_user_roles_user_role_active
                                UNIQUE (user_id, role, active)
);

-- Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(active) WHERE active = true;

-- Composite index for fetching user's active roles
CREATE INDEX idx_user_roles_user_active ON user_roles(user_id, active) WHERE active = true;

-- Index for audit queries (who assigned roles)
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by) WHERE assigned_by IS NOT NULL;