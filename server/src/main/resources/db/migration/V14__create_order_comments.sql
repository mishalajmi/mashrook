CREATE TABLE order_comments (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    order_id        UUID            NOT NULL REFERENCES orders(id),
    user_id         UUID            NOT NULL REFERENCES users(id),
    organization_id UUID            NOT NULL REFERENCES organizations(id),
    content         TEXT            NOT NULL,
    is_internal     BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_comments_order_id ON order_comments(order_id);
