# Industries capability marquee UI notes

Date: 2026-09-22

## Sources checked

- IBM Carbon Design System, 2x Grid: https://carbondesignsystem.com/elements/2x-grid/overview/
- MDN, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- W3C WCAG 2.2, Pause, Stop, Hide: https://www.w3.org/TR/WCAG22/#pause-stop-hide
- Salesforce Trust: https://trust.salesforce.com/
- ServiceNow Trust Center: https://www.servicenow.com/trust.html
- Workday Trust Center: https://www.workday.com/en-us/company/about-workday/trust.html

## Practical guidance for QTS landing

- Treat the rail as an enterprise capability band, not a decorative logo wall. Each item should carry one capability name and one plain-language outcome.
- Keep the section on the same light paper background as the rest of the landing page. Heavy dark bands were previously rejected by the user and make the page feel less consistent.
- Use spacing in an 8px rhythm: 16px item gaps, 32px section-to-rail spacing, and compact card padding.
- Avoid wide letter spacing and uppercase-heavy Vietnamese. Keep typography readable with normal letter spacing and short lines.
- Do not pause on hover. The user explicitly requested continuous movement when the pointer enters the marquee.
- Still provide motion control. WCAG guidance expects moving content that lasts more than five seconds to have a pause/stop/hide mechanism, so the UI includes a small explicit pause/resume button.
- Respect reduced-motion preferences. When the operating system asks for reduced motion, show the same content as a static grid instead of a frozen marquee.

## Resulting design direction

The QTS rail should feel like a trust/proof layer: quiet, stable, and operational. It should avoid generic AI-site patterns such as oversized floating text, fake logo walls, dark gradient strips, and decorative animation with no information value.
