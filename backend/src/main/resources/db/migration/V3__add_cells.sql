ALTER TABLE site ADD COLUMN cells INT NOT NULL DEFAULT 3 CHECK (cells > 0);

UPDATE site SET cells = CASE name
  WHEN 'LYN-PartDieu'      THEN 9
  WHEN 'LYN-Bellecour'     THEN 6
  WHEN 'LYN-Confluence'    THEN 6
  WHEN 'VLB-Villeurbanne'  THEN 6
  WHEN 'LYN-CroixRousse'   THEN 4
  ELSE 3
END;