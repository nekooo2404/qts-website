# 05 — Frontend Component Architecture

> Đối tượng: Frontend, UI designer. Stack giữ nguyên Next.js 15 App Router + Tailwind + Framer Motion.

## 1. Phân lớp

```
apps/web/
  app/[locale]/(marketing)/     — RSC pages, fetch CMS ở server
  components/
    ui/                        — primitive: Button, Input, Card, Dialog (dùng token 02)
    marketing/                 — SiteHeader, SiteFooter, MarketingShell (đã gọn)
    blocks/                    — Hero, FeatureGrid, Testimonial, CTA, RichText, Image, FAQ
  lib/
    cms.ts                     — fetch Wagtail + zod validate
    seo.ts                     — build metadata, JSON-LD
  fonts.ts                     — next/font/local (Be Vietnam Pro + Inter)
```

Quy tắc: `ui` không import `blocks`; `blocks` không fetch — chỉ nhận props đã validate.

## 2. Server / Client boundary

- Page/layout là **RSC** — fetch CMS bằng `fetch` với `next: { revalidate: 60, tags: ["cms:pages"] }`.
- Chỉ `ContactForm`, `SiteHeader` (mega menu state), `MotionProvider` là client component.
- `MarketingShell` bỏ `AnimatePresence mode="wait"` và `window.scrollTo` khỏi critical path. Nếu giữ hiệu ứng chuyển trang, phải gated bởi `prefers-reduced-motion` và không block paint.

## 3. Block renderer

```ts
// lib/cms.ts — zod schema cho từng block type
const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), heading: z.string(), sub: z.string(), cta: CtaSchema }),
  z.object({ type: z.literal("feature_grid"), items: z.array(FeatureSchema).max(6) }),
  // ...
]);

// components/blocks/BlockRenderer.tsx — RSC
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return blocks.map(b => {
    switch (b.type) {
      case "hero": return <HeroBlock key={b.id} {...b} />;
      case "feature_grid": return <FeatureGrid key={b.id} {...b} />;
      // exhaustive — TS error nếu thiếu case
    }
  });
}
```

CMS trả JSON → zod parse → render. Payload sai = log + fallback UI, không crash trang.

## 4. Ảnh & font

- Bật lại `next/image` — xóa `images.unoptimized` trong `next.config.ts`. Thêm `remotePatterns` cho `cms-media`.
- `next/font/local` cho Be Vietnam Pro + Inter, `display: swap`, subset `vietnamese + latin`.

## 5. Danh sách xóa / sửa

| File | Hành động | Lý do |
|---|---|---|
| `components/QtsSite.tsx` | **Xóa** | Code chết, form thứ hai trùng |
| `globals.css` 76KB | Gọn còn ~50 dòng base | Token chuyển vào `tailwind.config.ts` |
| `MarketingShell.tsx` | Sửa | Bỏ route animation block, bỏ scrollTo |
| `HomeExperience.tsx` | Sửa | Toast loop phải gated, stat/logo fake thay bằng CMS data |
| `ContactForm.tsx` | Sửa | Gọi `/api/...` tương đối, thêm consent + idempotency_key + honeypot |
| `next.config.ts` | Sửa | Thêm `rewrites()`, bật `images`, thêm `headers()` CSP/cache |

## 6. Lint & guard

- `eslint-config-next` đã có nhưng chưa enforce — bật `next/core-web-vitals` trong eslint.
- Thêm rule cấm `style={{` (trừ image props) và cấm hex literal ngoài `tailwind.config.ts`.
- `typecheck` + `lint` chạy trong CI (07) trước khi build.

## 7. SEO per-page

Mỗi `[locale]/.../page.tsx` export `generateMetadata()` đọc `seo_*` từ CMS (04 mục 7) → `title`, `description`, `canonical`, `openGraph`, `alternates.hreflang`, `robots`. JSON-LD (`Organization`, `BreadcrumbList`, `Article`) inject qua `seo.ts`.

## 8. Testing

- Vitest: zod schema, `seo.ts`, `cms.ts` fetcher.
- Playwright: 5 luồng — home render, locale switch, form submit success, form validation error, 404.
