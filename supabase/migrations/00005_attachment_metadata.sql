-- Add title and description fields to attachments
ALTER TABLE attachments
  ADD COLUMN title text,
  ADD COLUMN description text;

-- Update the full-text search index to include title and description
DROP INDEX IF EXISTS idx_attachments_fts;
ALTER TABLE attachments DROP COLUMN IF EXISTS fts;

ALTER TABLE attachments
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(file_name, '') || ' ' ||
      coalesce(title, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

CREATE INDEX idx_attachments_fts ON attachments USING gin(fts);
