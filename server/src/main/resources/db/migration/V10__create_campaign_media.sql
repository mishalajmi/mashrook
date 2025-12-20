CREATE TABLE IF NOT EXISTS campaign_media (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    campaign_id     UUID            NOT NULL,
    media_url       VARCHAR(2048)   NOT NULL,
    media_type      VARCHAR(50)     NOT NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'ENABLED',
    created_by      UUID,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT fk_campaign_media_campaign_id
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_campaign_media_campaign_id ON campaign_media(campaign_id);
CREATE INDEX idx_campaign_media_created_by ON campaign_media(created_by);
CREATE INDEX idx_campaign_media_status ON campaign_media(status);
