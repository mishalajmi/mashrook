CREATE TABLE IF NOT EXISTS campaign_fulfillments (
    id                  UUID            PRIMARY KEY DEFAULT uuidv7(),
    campaign_id         UUID            NOT NULL,
    buyer_org_id        UUID            NOT NULL,
    pledge_id           UUID            NOT NULL,
    delivery_status     VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
    delivered_quantity  INTEGER,
    delivery_date       DATE,
    notes               TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP,

    CONSTRAINT fk_campaign_fulfillments_campaign_id
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_campaign_fulfillments_buyer_org_id
        FOREIGN KEY (buyer_org_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_campaign_fulfillments_pledge_id
        FOREIGN KEY (pledge_id)
        REFERENCES pledges(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_campaign_fulfillments_campaign_id ON campaign_fulfillments(campaign_id);
CREATE INDEX idx_campaign_fulfillments_buyer_org_id ON campaign_fulfillments(buyer_org_id);
CREATE INDEX idx_campaign_fulfillments_pledge_id ON campaign_fulfillments(pledge_id);
CREATE INDEX idx_campaign_fulfillments_delivery_status ON campaign_fulfillments(delivery_status);
