# Landing layout and typography sources for QTS

- Date: 2026-09-21
- Status: Research note
- Scope: Enterprise/B2B marketing homepage layout, section order, proof placement, and typographic hierarchy for the QTS public landing page.
- Source policy: Prefer official company homepages, design-system documentation, WCAG, and high-trust UX research. Page libraries are used only as pattern references, not as authority.
- Non-scope: This note does not implement a redesign and does not validate the current page visually in a browser.

## Executive takeaways

1. QTS should keep the current enterprise "Operational Signal" direction, but the homepage would benefit from a tighter narrative order: hero, credibility strip, platform/product understanding, solution outcomes, operational proof story, enterprise readiness, FAQ, CTA.
2. The current page already has most needed blocks. The main issue is not missing content. It is that proof, platform, solutions, and differentiators compete before the visitor has a simple product mental model.
3. The first viewport should do fewer things. Use one category-level promise, one short supporting paragraph, one primary conversion action, one secondary exploration action, and one strong product or operational visual. Move secondary metadata out of the hero.
4. If QTS does not yet have public customer logos or measured outcomes, avoid logo-wall and metric-wall patterns. Use legal credentials, delivery method, security posture, source-backed resources, and clearly labeled illustrative scenarios instead.
5. Typography should support scanning: short H1, body copy around 2-3 lines in the hero, section headings that name the buyer problem, fewer repeated eyebrows, and consistent measure around 60-70 characters for paragraphs.

## Sources reviewed

### Enterprise and B2B homepage patterns

- [Salesforce homepage](https://www.salesforce.com/) - Current homepage inspected on 2026-09-21. The page leads with a category/positioning message around Agentic CRM and direct get-started style actions.
- [Workday homepage](https://www.workday.com/) - Current homepage inspected on 2026-09-21. Workday ties AI messaging directly to HR, finance, and IT, which keeps the abstract AI promise grounded in business categories.
- [Stripe homepage](https://stripe.com/) - Current homepage inspected on 2026-09-21. Stripe leads with a literal category promise: financial infrastructure for revenue growth, followed by a broad but concrete capability set.
- [Atlassian homepage](https://www.atlassian.com/) - Current homepage inspected on 2026-09-21. Atlassian uses a broad collaboration/teams category and connects the AI/agent narrative to teamwork.
- [Microsoft AI for business](https://www.microsoft.com/en-us/microsoft-cloud) - Current page inspected on 2026-09-21. Microsoft leads with AI and business tools, then routes users into product and solution paths.
- [IBM Consulting](https://www.ibm.com/consulting) - Current page inspected on 2026-09-21. IBM keeps the top-level category extremely clear and lets proof and detail sit below.

Common pattern across these pages: the hero is not a full strategy deck. It sets category, buyer relevance, and next action. Detail comes later through product paths, solution paths, proof, resources, and conversion blocks.

### UX research and accessibility

- [NN/g - Top 10 Guidelines for Homepage Usability](https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/) - Supports making the homepage purpose, starting points, and company identity clear.
- [NN/g - The Fold Manifesto](https://www.nngroup.com/articles/page-fold-manifesto/) - Supports treating the first viewport as a high-value orientation zone while still designing for scrolling.
- [W3C WCAG 2.2 - Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) - Supports maintaining readable text and control contrast, especially in dark operational sections and orange CTA states.

### Design-system and layout references

- [IBM Carbon 2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/) - Useful reference for disciplined enterprise layout, responsive grids, and predictable spacing systems.
- [Atlassian Design System - Grid](https://atlassian.design/foundations/grid/) - Useful reference for responsive layout foundations and alignment discipline in complex product ecosystems.
- [Salesforce Lightning Design System - Layout](https://www.lightningdesignsystem.com/guidelines/layout/) - Useful reference for enterprise layout structure and responsive composition.
- [Shopify Polaris - Layout](https://polaris.shopify.com/foundations/layout) - Useful reference for page structure, grouping, and information hierarchy, even though it is more product UI than marketing.
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks) and [Figma Community landing-page resources](https://www.figma.com/community/landing-pages) - Useful as pattern libraries for common section archetypes, but not authority for QTS strategy.

## Shared layout patterns

Enterprise B2B pages tend to use this narrative:

1. Hero: category, value, audience, primary CTA, secondary CTA, product/business visual.
2. Trust or credibility: logos if real, compliance/legal facts if early-stage, security posture, analyst/source-backed proof, or customer evidence.
3. Product/platform comprehension: what the system is, what modules connect, how it works.
4. Solution routing: buyer-friendly paths by business function, industry, or operational problem.
5. Proof story: case study, before/after model, workflow example, or implementation approach.
6. Enterprise readiness: security, integration, governance, implementation model, support.
7. Decision support: resources, FAQ, procurement blockers.
8. Conversion: final CTA with one clear next step.

For QTS, this means the homepage should feel like a calm enterprise decision path, not a pile of equally important sections.

## Recommended QTS section order

Recommended order for the QTS homepage:

1. Hero
   - Keep the asymmetric split hero.
   - H1 should be the literal offer or category, for example "Nền tảng vận hành số cho doanh nghiệp" or "QTS Digital Workplace".
   - Keep one short paragraph, one primary CTA to contact/advisory, and one secondary CTA to platform/solutions.
   - Move extra metadata such as method labels and capability tags below the first viewport unless they are essential.

2. Credibility strip
   - Keep the current legal/company facts, but frame them as "Thông tin doanh nghiệp có thể kiểm tra".
   - Replace capability wordmarks that look like fake logos with concrete trust signals: ngành đăng ký, trụ sở, nguyên tắc bảo mật, nguồn tài nguyên chính thức.

3. Platform overview
   - Move the platform explorer earlier, before broad proof cards.
   - Job: help the visitor understand what QTS actually connects: CRM, ERP, AI, analytics, cloud, workflow, access control.

4. Solution routing
   - Keep the solution bento after platform overview.
   - Make each tile answer a buyer question: "Tôi có vấn đề gì?" and "QTS xử lý lớp nào?" rather than only listing capability names.

5. Operational proof story
   - Merge or reposition the current proof-point cards and illustrative case-study flow.
   - Prefer one strong narrative: current state, QTS approach, operating target.
   - Keep the "illustrative" disclosure, but make it calm and compact so it does not dilute the story.

6. Enterprise readiness
   - Keep "Vì sao chọn QTS", but rewrite the cards around procurement-grade concerns: security and access control, integration governance, implementation method, handover/support.
   - Avoid generic "AI in workflow" claims unless tied to a concrete human-review or decision-support process.

7. Resources or decision support
   - If resources are important, show 2-3 curated resources before FAQ.
   - Otherwise keep resources as a CTA inside the proof story.

8. FAQ
   - Keep FAQ before final CTA.
   - Make questions address buying blockers: data security, system integration, timeline, scope discovery, ownership, handover, and what information QTS needs before a first call.

9. Final CTA
   - Keep one direct CTA.
   - Use the same conversion language as the hero primary CTA to avoid duplicate intent.

## What should be rearranged in the current landing page

Current order:

1. Hero and trust strip
2. Capability proof cards
3. Platform explorer
4. Solutions bento
5. Illustrative operational model
6. QTS differentiators
7. FAQ
8. CTA

Recommended change:

- Move Platform Explorer before the ProofPointShowcase. Visitors need a product/platform mental model before interpreting proof-style cards.
- Turn ProofPointShowcase into either "Phương pháp triển khai" or merge it with the case-study section. The current "proof" cards are not customer proof, so their placement can overpromise.
- Keep SolutionsBento after PlatformExplorer. That sequence reads naturally: platform first, business outcomes second.
- Keep the illustrative case after solutions, but let it become the main proof story rather than another abstract explanation block.
- Strengthen "Vì sao chọn QTS" into enterprise readiness. It should answer why a buyer can trust QTS with sensitive systems.
- Keep FAQ and final CTA at the end, but make FAQ more procurement-focused.

## Typography and hierarchy guidance

- Hero H1: 6-10 words if possible. Avoid making the H1 carry the whole business plan.
- Hero paragraph: 2-3 lines on desktop, 3-4 lines on mobile. If it needs more, split detail into the next section.
- Section headings: favor concrete buyer outcomes over broad inspiration.
- Eyebrows: use fewer. The current pattern uses a small label on almost every section, which weakens hierarchy. Reserve them for section shifts or important context.
- Body measure: keep paragraphs around 60-70 characters. Long enterprise paragraphs are acceptable only on resource/detail pages, not the homepage.
- CTA labels: primary action should stay consistent across the page. Good examples for QTS: "Yêu cầu tư vấn", "Trao đổi với chuyên gia", or "Khám phá nền tảng", but avoid using several labels for the same contact intent.

## Anti-patterns to avoid

- Fake customer logos, fake metrics, or capability words styled like logos.
- Overusing "AI agents" language because large enterprise pages currently use it. QTS can mention AI only where it is concrete, reviewed by humans, and tied to a workflow.
- Three equal-card sections repeated too often. Use cards for real grouped items, not for every section.
- Too many first-viewport signals: kicker, eyebrow, H1, paragraph, two CTAs, meta strip, method artifact, image caption, scenario overlay. Pick the few that orient the buyer fastest.
- Dark sections that feel like separate sites. QTS can keep dark operational sections, but each dark band needs a clear narrative job.
- Decorative captions and disclaimers that draw more attention than the business message.

## Practical implementation plan

Phase 1, low risk:

- Reorder sections: Hero, TrustStrip, PlatformExplorer, SolutionsBento, Proof/Case, Enterprise readiness, FAQ, CTA.
- Rename or rewrite headings so each section has a sharper job.
- Remove or demote hero meta if it competes with primary CTA.
- Replace capability wordmarks in the trust strip with verifiable facts.

Phase 2, medium risk:

- Merge ProofPointShowcase and case study into a single "operational proof model" section.
- Add a compact resources block if white papers are part of the buyer journey.
- Rewrite FAQ around procurement/security/integration blockers.

Phase 3, visual polish:

- Reduce repeated eyebrows.
- Normalize radii and card depth to the existing Operational Signal system.
- Use one accent action color consistently.
- Verify contrast in dark sections and button states against WCAG contrast guidance.

## Bottom line

QTS does not need a blank-slate landing redesign. It needs a stronger enterprise buying sequence. The visual system is already distinctive enough; the layout should now make the visitor understand QTS in this order: what it is, why it is credible, how the platform works, which business problems it serves, how QTS delivers safely, and what to do next.
