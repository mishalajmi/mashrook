CREATE TABLE IF NOT EXISTS payment_intents (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    campaign_id     UUID            NOT NULL,
    pledge_id       UUID            NOT NULL,
    buyer_org_id    UUID            NOT NULL,
    amount          DECIMAL(19, 4)  NOT NULL CHECK (amount > 0),
    status          VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    retry_count     INTEGER         NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT fk_payment_intents_campaign_id
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_intents_pledge_id
        FOREIGN KEY (pledge_id)
        REFERENCES pledges(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_intents_buyer_org_id
        FOREIGN KEY (buyer_org_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_payment_intents_campaign_id ON payment_intents(campaign_id);
CREATE INDEX idx_payment_intents_pledge_id ON payment_intents(pledge_id);
CREATE INDEX idx_payment_intents_buyer_org_id ON payment_intents(buyer_org_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
