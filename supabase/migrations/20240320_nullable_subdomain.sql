-- Make subdomain column nullable
ALTER TABLE websites ALTER COLUMN subdomain DROP NOT NULL; 