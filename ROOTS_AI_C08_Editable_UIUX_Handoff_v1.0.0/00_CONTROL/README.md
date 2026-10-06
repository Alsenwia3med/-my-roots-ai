# ROOTS-AI™ C-08 Editable UI/UX Handoff

**Package:** `ROOTS_AI_C08_Editable_UIUX_Handoff_v1.0.0`  
**Version:** 1.0.0  
**Package Issue Date:** August 2026  
**Owner:** ROOTS AI HEALTH SYSTEMS, Inc.  
**Status:** PHASE 0 — FOR REVIEW

## Package Overview

This package defines the editable UI/UX and brand-asset handoff for the ROOTS-AI™ Phase 1 MVP.

| Metric | Count |
|---|---:|
| Total screens | 48 |
| Total SVG files | 192 |
| Breakpoints per screen | 4 (360, 768, 1024, 1440) |
| Design tokens | Included |
| Screen catalog | Included |
| SVG frames and source images | Pending Phase 0B delivery |

## Document Authority

- **C-01** controls canonical questions, options, required/N/A rules and module order.
- **C-02** controls deterministic scoring, classifications, drivers and Golden Tests.
- **C-03** controls report content, structure and report visuals.
- **C-04** controls exact website, legal, consent, system and error copy.
- **C-05** controls screen composition, navigation, responsive behavior, components, states and role visibility.
- **C-06** controls the executable technical baseline.
- **C-07** controls atomic traceability, evidence and acceptance.
- **C-08** supplies editable design frames, tokens and approved design assets.

No file in this package amends or narrows the signed Agreement or Controlled Baseline. Conflicts must be raised through ROOTS Change Control before implementation.

## Package Structure

```text
ROOTS_AI_C08_Editable_UIUX_Handoff_v1.0.0/
├── 00_CONTROL/
│   ├── README.md
│   ├── design_tokens.json
│   └── screen_catalog.json
├── 01_BRAND_ASSETS/
├── 02_SOURCE_IMAGES/
├── 03_HTML_REFERENCE/
├── 04_SCREENS/
│   ├── PUBLIC/
│   ├── LEGAL/
│   ├── ASSESSMENT/
│   ├── REPORT/
│   ├── ADMIN/
│   └── SYSTEM/
└── 05_QA/
```

## Inventory

| Category | Screens | SVG files |
|---|---:|---:|
| PUBLIC | 12 | 48 |
| LEGAL | 5 | 20 |
| ASSESSMENT | 11 | 44 |
| REPORT | 5 | 20 |
| ADMIN | 10 | 40 |
| SYSTEM | 5 | 20 |
| **TOTAL** | **48** | **192** |

## Naming and Validation

Frame names use `{SCREEN_ID}_{BREAKPOINT}.svg`, for example `PUB-01_360.svg`. Every frame must have a matching catalog entry, valid XML, a viewBox, title, description, `data-screen-id`, `data-size`, `data-permission`, and route metadata where applicable. Modal/overlay frames use `data-presentation` and `data-parent-screen-id` instead of a route.

Required validation includes XML parsing, viewBox bounds, asset existence, placeholder detection, Figma editability, visual-regression captures at 360/768/1024/1440, keyboard/focus behavior, contrast, touch targets and screen-reader smoke tests.

## Version Control

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | August 2026 | Initial foundation release |

**Owner:** ROOTS AI HEALTH SYSTEMS, Inc.  
**Document ID:** ROOTS-C08-DESIGN-001
