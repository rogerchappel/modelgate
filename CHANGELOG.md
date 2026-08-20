# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Fixed

- Adopt the available `modelgate-cli` npm identity while retaining the `modelgate` executable, with registry, documentation, import, and packed-artifact checks.
- Reject malformed provider, model, and route fixture fields with indexed configuration paths before inspection.
- Report repeated fallback IDs and primary-as-fallback entries as configuration errors without double-counting route estimates.

### Changed

- Added a named package smoke script and CI step for npm pack verification.

### Added

- Local-first TypeScript library for loading redacted provider and route fixtures.
- `modelgate inspect` CLI with Markdown and JSON output.
- Cost estimates, fallback checks, budget ceilings, and tag-policy findings.
- Fixture-backed Node tests and real CLI smoke validation.
- README, safety policy, contributing guidance, examples, and GitHub metadata.

### Changed

- Added a named package smoke script and routed the release check through it.

## Release Links

- Latest release: `https://github.com/rogerchappel/modelgate/releases/latest`
