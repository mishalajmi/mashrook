CREATE TABLE IF NOT EXISTS campaigns (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    supplier_id     UUID            NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    product_details JSONB,
    duration_days   INTEGER         NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    target_qty      INTEGER         NOT NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT fk_campaigns_supplier_id
        FOREIGN KEY (supplier_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_campaigns_supplier_id ON campaigns(supplier_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX idx_campaigns_status_dates ON campaigns(status, start_date, end_date);
CREATE INDEX idx_campaigns_supplier_status ON campaigns(supplier_id, status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
