-- Create invoices table
CREATE TABLE invoices
(
    id              UUID PRIMARY KEY        DEFAULT uuidv7(),
    campaign_id     UUID           NOT NULL REFERENCES campaigns (id),
    pledge_id       UUID           NOT NULL UNIQUE REFERENCES pledges (id),
    organization_id UUID           NOT NULL REFERENCES organizations (id),
    invoice_number  VARCHAR(20)    NOT NULL UNIQUE,
    subtotal        NUMERIC(19, 4) NOT NULL CHECK (subtotal >= 0),
    tax_amount      NUMERIC(19, 4) NOT NULL CHECK (tax_amount >= 0),
    total_amount    NUMERIC(19, 4) NOT NULL CHECK (total_amount >= 0),
    status          VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    due_date        DATE           NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_invoices_campaign_id ON invoices (campaign_id);
CREATE INDEX idx_invoices_organization_id ON invoices (organization_id);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_invoices_invoice_number ON invoices (invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices (due_date);