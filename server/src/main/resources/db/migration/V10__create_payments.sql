CREATE TABLE payments
(
    id                        UUID PRIMARY KEY        DEFAULT uuidv7(),
    invoice_id                UUID           NOT NULL REFERENCES invoices (id),
    organization_id           UUID           NOT NULL REFERENCES organizations (id),
    buyer_id                  UUID           NOT NULL REFERENCES users (id),
    amount                    NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
    payment_method            VARCHAR(20)    NOT NULL,
    notes                     TEXT,
    recorded_by_user_id       UUID           REFERENCES users (id),
    status                    VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    payment_provider          VARCHAR(20),
    provider_transaction_id   VARCHAR(255),
    provider_checkout_id      VARCHAR(255),
    provider_response_code    VARCHAR(50),
    provider_response_message TEXT,
    error_code                VARCHAR(50),
    error_message             TEXT,
    idempotency_key           VARCHAR(255),
    created_at                TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP
);

-- Step 5: Create indexes for common query patterns
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_payment_provider ON payments (payment_provider);
CREATE INDEX idx_payments_payment_method ON payments (payment_method);
CREATE INDEX idx_payments_idempotency_key ON payments (idempotency_key);
CREATE INDEX idx_payments_provider_checkout_id ON payments (provider_checkout_id);
CREATE INDEX idx_payments_buyer_id ON payments (buyer_id);
CREATE INDEX idx_payments_organization_id ON payments (organization_id);
CREATE INDEX idx_payments_created_at ON payments (created_at);

-- Step 6: Add unique constraint on idempotency_key (for non-null values)
CREATE UNIQUE INDEX idx_payments_idempotency_key_unique ON payments (idempotency_key) WHERE idempotency_key IS NOT NULL;
