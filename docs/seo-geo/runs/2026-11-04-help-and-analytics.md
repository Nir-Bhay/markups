# Troubleshooting hub and editorial analytics source fix

- Added `/blog/markdown-troubleshooting`: a symptom-based hub linking eight existing solutions. It is a CollectionPage, not a sixteenth blog article. Blog library remains 15 posts; sitemap now has 34 URLs.
- Added hub navigation on blog index/article pages, sitemap and llms references.
- Added a shared public-page telemetry entry on landing, guide and editorial pages using the existing GA4 bootstrap, with static page titles. Added initialization deduplication; existing production hostname, safe query and fragment protections remain unchanged.
- M-059 is source-fixed; production event receipt, privacy/consent review and account-side reporting remain unverified until reviewed release. This supersedes the earlier source finding that editorial pages do not import telemetry; it does not prove live measurement.
- Two telemetry test files passed: 12 tests. Production build passed. SEO audits: 40 HTML pages / 34 sitemap URLs, zero errors/warnings; required artifacts pass.
- Production was not deployed; current live 404/indexing issues require release verification separately.
