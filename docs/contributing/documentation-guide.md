---
slug: /contributing/documentation-guide

title: Documentation Contribution Guide
description: Writing guidelines, formatting standards, Docusaurus setup, and documentation reviews for SoroScan.
sidebar_label: Docs Guide
hide_title: false
---

# Documentation Contribution Guide

High-quality documentation is just as important as high-quality code. This guide explains how to write, format, structure, and preview documentation for SoroScan.

---

## 1. Documentation Architecture

SoroScan documentation is hosted at `docs.soroscan.io` and is powered by **Docusaurus**.
- The raw markdown files are located in the [docs/](file:///workspaces/soroscan/docs/) directory at the repository root.
- The Docusaurus configuration and static assets reside in the [soroscan-docs/](file:///workspaces/soroscan/soroscan-docs/) folder.

---

## 2. Writing Style Guide

Keep documentation clean, readable, and highly informative. Follow these principles:
- **Active Voice**: Write in the active voice. Use "Run this command" instead of "This command should be run."
- **Clear Headings**: Use descriptive headings. Avoid single-word headings.
- **Syntax Highlighting**: Always specify the language for code fences:
  ```markdown
  ```bash
  python manage.py runserver
  ```
  ```
- **File & Code Symbol Links**: Link to directories, files, or specific line ranges in code blocks. Make sure they are clickable links (e.g. `[manage.py](file:///workspaces/soroscan/django-backend/manage.py)`). Do not wrap the link text itself in backticks, as this breaks link formatting.
- **Alerts**: Use strategic alerts to highlight critical information:
  ```markdown
  > [!IMPORTANT]
  > This is a high-priority warning about database security.
  ```

---

## 3. Formatting with Metadata (Frontmatter)

Every markdown document in SoroScan docs must begin with a YAML Frontmatter block defining the page's metadata:

```yaml
---

title: Database & Cache Administration Guide
description: Production administration, migrations, maintenance, performance tuning, and troubleshooting for PostgreSQL and Redis in SoroScan.
sidebar_label: Database & Cache Admin
hide_title: false
---
```

- **`id`**: Unique identifier matching the relative path of the file without the `.md` extension.
- **`title`**: The page title displayed in the browser tab and at the top of the content.
- **`sidebar_label`**: The text displayed in the navigation sidebar (can be shorter than the full title).
- **`description`**: A concise summary of the page (used for SEO meta tags).

---

## 4. Modifying the Sidebar Navigation

To expose a new document in the documentation sidebar, update [soroscan-docs/sidebars.ts](file:///workspaces/soroscan/soroscan-docs/sidebars.ts).
- Add the `id` of your document to the relevant category's `items` array:

```typescript
    {
      type: 'category',
      label: 'Cookbook',
      items: [
        'cookbook/track-contract-events',
        'cookbook/setup-webhook',
        // Add your page ID here
      ],
    },
```

---

## 5. Previewing Documentation Locally

To preview your documentation changes before submitting a Pull Request, you can run Docusaurus locally.

### 5.1 Installation & Setup
Ensure you have Node.js installed, then run:
```bash
cd soroscan-docs
npm install
```

### 5.2 Start Development Server
```bash
npm run start
```
This command starts a local development server and opens a browser window at `http://localhost:3000`. It enables live reloading: any changes you make to markdown files under the `docs/` directory will compile and show up immediately.

### 5.3 Building for Production
Before pushing your docs, verify they build correctly without errors:
```bash
npm run build
```
This is the command run in our CI pipeline. If it fails due to broken links or syntax errors, your PR will be blocked from merging.

---

## 6. Reviewing Documentation Pull Requests

When reviewing documentation PRs, check for:
- **Accuracy**: Is the technical setup correct? Are the code examples copy-paste runnable?
- **Link Integrity**: Click all links to make sure they resolve to valid pages or files.
- **Formatting**: Verify frontmatter parameters are correct and the page displays nicely in Docusaurus.
- **Typos & Grammar**: Check spelling and general readability.
