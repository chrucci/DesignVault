# Design Vault — MVP Spec

**Owner:** Laura 📋 (spec), Chris 🤖 (stakeholder)
**User:** Deb (Deborah Lynn Designs — Decorating Den Interiors)
**Engineer:** TBD
**Branding Agent:** Bebot 🏗️ (knows Deb's logo, colors, brand style)
**Date:** 2026-03-15
**Status:** Spec Complete — Ready for assignment

---

## Problem

Deb is an interior decorator who shops ~100 supplier websites for products. Her franchise provided a web clipper that captured product data, organized it into projects, and generated invoices and spec sheets. **That tool broke years ago and tech support won't fix it.** She's been doing everything manually since — clipping product info by hand, building mood boards in presentation software, creating invoices and spec sheets manually. It's slow, error-prone, and eating into billable time.

## Solution

**Design Vault** — a web app + browser extension that lets Deb clip products from any supplier site, organize them into client projects (with rooms), and generate three professional outputs: mood boards, invoices, and contractor spec sheets.

---

## Users

- **Deb** — sole user (single-tenant, no multi-user auth needed for MVP)
- Shares outputs with clients and contractors via email or showing on tablet
- No client login or portal needed

## Platforms

| Platform | Capability |
|----------|-----------|
| **Desktop** (Chrome/Edge) | Full app + browser extension |
| **Tablet** (Android) | Full app + browser extension (Chrome) |
| **Phone** | View-only — browse projects and clipped products, no clipping |

---

## Core Workflow

```
1. CLIP — Capture product data from supplier website
2. ORGANIZE — Assign product to a Project → Room
3. PRICE — Set per-product markup (wholesale → retail)
4. PRESENT — Generate mood board for client review
5. APPROVE — Client reviews, Deb adjusts selections
6. INVOICE — Generate branded PDF invoice
7. SPEC — Generate contractor spec sheet PDF
8. ORDER — Quick-link back to supplier for purchasing
```

---

For complete spec details, see the original spec document shared during planning.
