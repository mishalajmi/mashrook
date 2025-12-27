CREATE TABLE IF NOT EXISTS pledges (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    campaign_id     UUID            NOT NULL,
    buyer_org_id    UUID            NOT NULL,
    quantity        INTEGER         NOT NULL CHECK (quantity > 0),
    status          VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    committed_at    TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT fk_pledges_campaign_id
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_pledges_buyer_org_id
        FOREIGN KEY (buyer_org_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_pledges_campaign_buyer
        UNIQUE (campaign_id, buyer_org_id)
);

CREATE INDEX idx_pledges_campaign_id ON pledges(campaign_id);
CREATE INDEX idx_pledges_buyer_org_id ON pledges(buyer_org_id);
CREATE INDEX idx_pledges_status ON pledges(status);
