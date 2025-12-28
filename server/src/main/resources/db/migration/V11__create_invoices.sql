-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    payment_intent_id UUID NOT NULL UNIQUE REFERENCES payment_intents(id),
    buyer_org_id UUID NOT NULL REFERENCES organizations(id),
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    subtotal NUMERIC(19,4) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(19,4) NOT NULL CHECK (tax_amount >= 0),
    total_amount NUMERIC(19,4) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_invoices_campaign_id ON invoices(campaign_id);
CREATE INDEX idx_invoices_buyer_org_id ON invoices(buyer_org_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Create invoice_payments table for tracking offline payment collections
CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL,
    payment_date DATE NOT NULL,
    notes TEXT,
    recorded_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for invoice_payments
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
