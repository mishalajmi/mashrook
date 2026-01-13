CREATE TABLE cancellation_requests (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID            NOT NULL REFERENCES orders(id),
    requested_by_id     UUID            NOT NULL REFERENCES users(id),
    reason              TEXT            NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    reviewed_by_id      UUID            REFERENCES users(id),
    reviewed_at         TIMESTAMP,
    review_notes        TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cancellation_requests_order_id ON cancellation_requests(order_id);
CREATE INDEX idx_cancellation_requests_status ON cancellation_requests(status);
