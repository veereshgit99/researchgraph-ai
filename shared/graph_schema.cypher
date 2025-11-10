// ======================================================
// 1. Drop old constraints if they exist
// ======================================================
DROP CONSTRAINT paper_arxiv_id IF EXISTS;
DROP CONSTRAINT author_id IF EXISTS;
DROP CONSTRAINT concept_name IF EXISTS;
DROP CONSTRAINT method_name IF EXISTS;
DROP CONSTRAINT dataset_name IF EXISTS;
DROP CONSTRAINT metric_name IF EXISTS;
DROP CONSTRAINT repo_url IF EXISTS;
DROP CONSTRAINT benchmark_id IF EXISTS;
DROP CONSTRAINT model_name IF EXISTS;

// ======================================================
// 2. Recreate constraints compatible with Community Edition
// ======================================================

// Unique paper
CREATE CONSTRAINT paper_arxiv_id IF NOT EXISTS
FOR (p:Paper) REQUIRE p.arxiv_id IS UNIQUE;

// Author — use synthetic unique ID (e.g., name_affiliation)
CREATE CONSTRAINT author_id IF NOT EXISTS
FOR (a:Author) REQUIRE a.id IS UNIQUE;

// Concept
CREATE CONSTRAINT concept_name IF NOT EXISTS
FOR (c:Concept) REQUIRE c.name IS UNIQUE;

// Method
CREATE CONSTRAINT method_name IF NOT EXISTS
FOR (m:Method) REQUIRE m.name IS UNIQUE;

// Dataset
CREATE CONSTRAINT dataset_name IF NOT EXISTS
FOR (d:Dataset) REQUIRE d.name IS UNIQUE;

// Metric
CREATE CONSTRAINT metric_name IF NOT EXISTS
FOR (met:Metric) REQUIRE met.name IS UNIQUE;

// Repository
CREATE CONSTRAINT repo_url IF NOT EXISTS
FOR (r:Repository) REQUIRE r.url IS UNIQUE;

// Benchmark
CREATE CONSTRAINT benchmark_id IF NOT EXISTS
FOR (b:Benchmark) REQUIRE b.id IS UNIQUE;

// Model
CREATE CONSTRAINT model_name IF NOT EXISTS
FOR (m:Model) REQUIRE m.name IS UNIQUE;

// ======================================================
// 3. Helpful property indexes
// ======================================================

CREATE INDEX paper_title IF NOT EXISTS
FOR (p:Paper) ON (p.title);

CREATE INDEX author_name IF NOT EXISTS
FOR (a:Author) ON (a.name);

CREATE INDEX concept_category IF NOT EXISTS
FOR (c:Concept) ON (c.category);

CREATE INDEX dataset_domain IF NOT EXISTS
FOR (d:Dataset) ON (d.domain);

CREATE INDEX repo_stars IF NOT EXISTS
FOR (r:Repository) ON (r.stars);

// ======================================================
// 4. Optional: Full-text search
// ======================================================

CALL db.index.fulltext.createNodeIndex(
  'paper_fulltext',
  ['Paper'],
  ['title', 'abstract']
);

// ======================================================
// 5. Optional: Relationship property index
// ======================================================

CREATE INDEX authored_by_position IF NOT EXISTS
FOR ()-[r:AUTHORED_BY]-() ON (r.position);
