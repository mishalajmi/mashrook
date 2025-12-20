CREATE TABLE IF NOT EXISTS discount_brackets (
    id              UUID            PRIMARY KEY DEFAULT uuidv7(),
    campaign_id     UUID            NOT NULL,
    min_quantity    INTEGER         NOT NULL,
    max_quantity    INTEGER,
    unit_price      NUMERIC(19, 4)  NOT NULL,
    bracket_order   INTEGER         NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,

    CONSTRAINT fk_discount_brackets_campaign_id
        FOREIGN KEY (campaign_id)
        REFERENCES campaigns(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_discount_brackets_campaign_id ON discount_brackets(campaign_id);
CREATE INDEX idx_discount_brackets_bracket_order ON discount_brackets(bracket_order);
