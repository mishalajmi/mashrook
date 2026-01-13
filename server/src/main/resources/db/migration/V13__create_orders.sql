CREATE TABLE orders (
    id                          UUID            PRIMARY KEY DEFAULT uuidv7(),
    order_number                VARCHAR(50)     NOT NULL UNIQUE,
    campaign_id                 UUID            NOT NULL REFERENCES campaigns(id),
    pledge_id                   UUID            NOT NULL REFERENCES pledges(id),
    invoice_id                  UUID            NOT NULL REFERENCES invoices(id),
    payment_id                  UUID            NOT NULL REFERENCES payments(id),
    buyer_org_id                UUID            NOT NULL REFERENCES organizations(id),
    supplier_org_id             UUID            NOT NULL REFERENCES organizations(id),
    delivery_address_id         UUID            REFERENCES addresses(id),

    is_digital_product          BOOLEAN         NOT NULL DEFAULT false,

    -- Physical delivery
    tracking_number             VARCHAR(255),
    carrier                     VARCHAR(100),
    estimated_delivery_date     DATE,
    actual_delivery_date        DATE,

    -- Digital delivery
    digital_delivery_type       VARCHAR(50),
    digital_delivery_value      TEXT,
    digital_delivery_date       TIMESTAMP,

    quantity                    INTEGER         NOT NULL,
    unit_price                  NUMERIC(19,4)   NOT NULL,
    total_amount                NUMERIC(19,4)   NOT NULL,

    status                      VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    cancellation_reason         TEXT,
    cancelled_by_user_id        UUID            REFERENCES users(id),
    cancelled_at                TIMESTAMP,

    created_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP
);

CREATE INDEX idx_orders_buyer_org_id ON orders(buyer_org_id);
CREATE INDEX idx_orders_supplier_org_id ON orders(supplier_org_id);
CREATE INDEX idx_orders_campaign_id ON orders(campaign_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
