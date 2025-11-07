## Paper Node Properties

### Core Properties (from ArXiv ingestion)
- `arxiv_id` (string, unique)
- `title` (string)
- `abstract` (text)
- `published_date` (date)
- `categories` (list<string>)
- `pdf_url` (string)
- `citation_count` (integer)
- `created_at` (datetime)
- `updated_at` (datetime)

### Enrichment Flags
- `enriched` (boolean) - Entity extraction completed
- `enriched_at` (datetime)
- `citations_fetched` (boolean)
- `citations_fetched_at` (datetime)
- `github_fetched` (boolean)
- `github_fetched_at` (datetime)
- `hf_enriched` (boolean) - Hugging Face data fetched
- `hf_enriched_at` (datetime)

### Hugging Face Properties (added by enrich_huggingface.py)
- `hf_url` (string) - Link to HF paper page
- `hf_upvotes` (integer) - Community upvotes
- `hf_collections_count` (integer) - Number of collections including paper
- `on_huggingface` (boolean) - Whether paper exists on HF

### Semantic Scholar Properties (added by enrich_citations.py)
- `citation_count` (integer) - Total citations (updated)