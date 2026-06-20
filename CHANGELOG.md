# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/); this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-20

UX overhaul from user review.

### Added
- Official vidIQ logo (SVG) as the node/credential icon.
- **Channel → Analytics**: the channel is now a dropdown of your vidIQ-linked channels
  (loadOptions); metrics is a multi-select; dates document the `YYYY-MM-DD` format.
- **Studio & AI → Generate Voiceover**: output "URL and Audio" now returns the MP3 as a binary
  attachment.
- Per-operation **Options → Timeout (ms)** so a stalled request fails fast instead of hanging.

### Changed
- Renamed the **Studio** resource to **Studio & AI**.
- `Video ID` / `Reel` / channel ID fields accept a bare ID/shortcode (URLs still work).
- **Find Similar**: `Size` renamed to **Limit** (max 50).
- **Get Videos**: `popular` is now a **Most Popular / Recent Uploads** dropdown.
- Required fields are marked required; country/language inputs document ISO codes with real examples.

### Removed
- **Extra Arguments (JSON)** escape hatch (replaced by typed fields + Timeout option).
- **Channel → List Competitors / Update Competitors** (these only work for the user's own channel).
- **Account → Submit Feedback**.
- **Channel → Analytics**: removed the confusing `dimensions`, `maxResults`, and `filters` fields.

## [0.1.0] - 2026-06-20

### Added
- Initial release. `VidIQ` node with 8 resources covering all 43 vidIQ MCP tools.
- `VidIqApi` credential (Bearer API key) with a live credential test.
