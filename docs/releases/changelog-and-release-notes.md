# Changelog and Release Notes Guide

This guide describes the standardized changelog and release notes process for SoroScan.

## Changelog Format

Use a structured changelog approach with the following sections:
- Features
- Fixes
- Breaking Changes
- Deprecations
- Performance Improvements
- Security Fixes
- Dependencies Updated

Each entry should be a short one-liner and include issue or PR references when available.

Example:
- Add support for async event streaming (#732)
- Fix database connection retry logic in worker service (#718)

### Tool recommendation
Use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) style for consistency.

## Release Notes Template

### Highlights
- Summarize the most important user-facing changes.

### New Features
- Describe new functionality in simple terms.

### Bug Fixes
- Explain resolved issues and the impact.

### Breaking Changes
- Clearly call out anything requiring manual migration.
- Include migration steps when needed.

### Deprecations
- List deprecated behavior or APIs.
- Include timing and replacement guidance.

### Performance Improvements
- Describe measurable improvements.

### Security Fixes
- Summarize security-related patches.

### Dependencies Updated
- Note notable dependency upgrades.

### Contributors
- Credit people who helped with the release.

### Download Links
- Provide links when publishing packages or artifacts.

## Version Management

### Semantic versioning guide
Use `MAJOR.MINOR.PATCH`:
- `MAJOR` for incompatible API changes
- `MINOR` for new backward-compatible features
- `PATCH` for fixes and improvements

### Alpha/Beta/RC versioning
Use pre-release identifiers for early builds:
- `1.0.0-alpha.1`
- `1.0.0-beta.2`
- `1.0.0-rc.1`

### Long-term support versions
Define stable release branches for long-term support and document the support timeline.

### Patch release policy
Use patch releases for critical bug fixes and security updates.

## Release Process

### Pre-release checklist
- Update changelog
- Confirm tests pass
- Validate package metadata
- Check version tags and branch policy

### Creating a release tag
- Tag main or release branch with semantic version
- Use annotated tags if possible

Example:
```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

### Publishing release notes
- Include summary, features, fixes, breaking changes, and links.
- Post notes in GitHub Releases.

### Announcement
- Publish a blog post, newsletter, or social update when appropriate.

### Support period notification
- Document how long the release will be supported.

## Backwards Compatibility

### Migration guide template
- What changed
- Why it changed
- Steps to update existing users

### Deprecation warnings
- Communicate deprecations early
- Provide replacement patterns

### API stability guarantees
- Document compatibility expectations for public APIs

### Database migration notices
- Call out schema changes and migration commands

## Changelog Examples

### Good examples
- Use clear headings and short statements.
- Reference issue/PR numbers.
- Keep human-readable language.

### Common pitfalls to avoid
- Avoid vague entries like "Misc fixes."
- Avoid mixing different releases in a single entry.
- Avoid burying breaking changes in non-highlight sections.
