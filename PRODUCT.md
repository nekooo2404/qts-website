# QTS HRM

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

HR Manager, HR Staff, managers, employees, accountants and system administrators work in a Vietnamese enterprise HR environment. Their daily jobs include operating employee records, attendance, leave, payroll, documents and approval queues within role, data-scope and field-level permissions.

## Product Purpose

QTS HRM is the independent workforce-management application in the QTS Digital Workplace. It makes employee information, operational work and approval work discoverable while preserving secure access to sensitive personal and payroll data.

## Positioning

The product combines an operational HR workspace with UI-visible RBAC, Data Scope and Field-Level Security boundaries; its frontend must never present UI hiding as authorization.

## Operating Context

Users authenticate through QTS Identity using OIDC Authorization Code + PKCE, enter the HRM application through an assigned app launcher and work from a desktop-first shell. The prototype uses fixture data for UI validation; production domain APIs for HRM are not yet implemented.

## Capabilities and Constraints

- Current stack: Vite, React 19, TypeScript, vanilla CSS and Heroicons.
- Existing routes cover dashboards, employee records, organisation, documents, contracts, recruitment, onboarding, attendance, leave, payroll, KPI, training, assets, reports, workflow and permission management.
- Sensitive data requires RBAC, Data Scope and FLS; sensitive view/download/edit/export must be audited. UI visibility is not authorization.
- Documents have no public URL and must remain private and encrypted in production.
- Fixture controls must not imply persistence, unsupported automation, approval routing or live AI analysis.
- Vietnamese is the HRM UI language. The QTS brand and QTS Blue commitment must remain recognizable.

## Brand Commitments

QTS is a professional, trustworthy enterprise product. The required visual direction is calm, premium, minimal and future-oriented while remaining data-first, security-first and workflow-first rather than a marketing product.

## Evidence on Hand

- Source architecture and security requirements: `docs/hrm-design/`.
- Current UI implementation and fixture data: `frontend-hrm/src/`.
- Three visual-reference screenshots are held in `hrm_qts_docs/`; they inspire hierarchy and interaction patterns only, not copied layouts or branding.
- No production HRM backend data, employee photography, AI model or live calendar service is available. These must not be fabricated as real.

## Product Principles

1. Make the most important operational fact visible first.
2. Let employee and operational data lead; decoration must earn its place.
3. Use layered surfaces only to clarify hierarchy and interaction.
4. Preserve factual and secure behavior over visual novelty.
5. Reach important work within two or three interactions.

## Accessibility & Inclusion

Keyboard operation, named icon controls, visible focus, escape routes for overlays, readable contrast, reduced-motion support, touch-safe ESS controls and non-color-only status communication are required.
