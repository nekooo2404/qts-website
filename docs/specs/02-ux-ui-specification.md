# 02 — UX/UI Specification

> Đối tượng: UI designer, Frontend. Mọi giá trị thiết kế phải qua token — cấm hardcode hex/spacing.

## 1. Nguyên tắc

- Token là sự thật duy nhất. `tailwind.config.ts` `theme.extend` chứa toàn bộ màu, spacing, radius, font, shadow, motion.
- Xóa `globals.css` như file 76KB chứa 292 hex rời rạc. Chỉ giữ reset + base layer mỏng.
- Desktop-first hiện tại (breakpoint 950/700) đổi sang mobile-first 6 mốc.

## 2. Design tokens

### 2.1 Màu (OKLCH — dễ kiểm soát contrast hơn hex)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--color-ink` | `oklch(0.18 0.02 260)` | Text chính |
| `--color-muted` | `oklch(0.55 0.02 260)` | Text phụ |
| `--color-line` | `oklch(0.92 0.01 260)` | Border |
| `--color-paper` | `oklch(0.99 0 0)` | Nền |
| `--color-brand` | `oklch(0.55 0.22 285)` | Primary (thay `#5b5cef`) |
| `--color-brand-pressed` | `oklch(0.48 0.22 285)` | Hover/active |
| `--color-accent` | `oklch(0.75 0.15 200)` | Accent |
| `--color-danger` | `oklch(0.6 0.2 25)` | Lỗi |

Không thêm màu ngoài bảng này nếu chưa qua review designer.

### 2.2 Typography

- Heading: `Be Vietnam Pro` (600/700), body: `Inter` (400/500) — self-host qua `next/font/local`.
- Scale: `xs 12 / sm 13 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 / 4xl 36` (line-height 1.5 cho body, 1.2 cho heading).
- Footer link tối thiểu 14px (hiện tại 11px vi phạm WCAG).

### 2.3 Spacing / Radius / Shadow

- Spacing: 4px base (`1 = 4px`, `2=8`, `3=12`, `4=16`, `6=24`, `8=32`, `12=48`).
- Radius: `sm 8 / md 12 / lg 16 / xl 28` (`--radius-xl` cũ giữ nhưng qua token).
- Shadow: `sm / md / lg` — không hardcode `box-shadow`.

### 2.4 Breakpoints (mobile-first)

```
sm  640 | md 768 | lg 1024 | xl 1280 | 2xl 1536
```
Xóa 2 mốc cũ 700/950.

## 3. Grid & layout

- Container `max-w-[1280px]` + padding `16 / 24 / 32` theo breakpoint.
- Header: `sticky` không `fixed` (tránh CLS khi co 76→58px). Chiều cao cố định 64px.
- Section padding dọc `48 / 64 / 96`.

## 4. Components — trạng thái bắt buộc

Mỗi component phải có đủ: `default / hover / focus-visible / active / disabled / loading / error`.

| Component | Ghi chú |
|---|---|
| Button | `primary / secondary / ghost`, size `sm/md/lg`, min target 44×44 (hiện tại 12×17) |
| Input/Textarea | `focus-visible` có ring `brand` 2px, không `outline:none` |
| Card | Dùng cho resources/industries |
| Mega menu | `focus-visible` có ring, không `outline:none`, hỗ trợ keyboard Esc/Arrow |
| Toast | Gated bởi `prefers-reduced-motion`, không auto-loop vô hạn |

## 5. Motion policy

- Tôn trọng `prefers-reduced-motion: reduce` **toàn cục** — tắt `repeat: Infinity`, marquee 36s, toast loop.
- `MarketingShell` bỏ `AnimatePresence mode="wait"` + `window.scrollTo(0,0)` khỏi critical path.
- `Cursor.tsx` custom cursor chỉ trên `pointer: fine` và đã gated — giữ nguyên.

## 6. Accessibility (WCAG 2.2 AA)

- Contrast text ≥ 4.5:1, large text ≥ 3:1.
- Focus ring ≥ 3:1 so với nền, luôn visible.
- Target ≥ 24×24 (khuyến nghị 44×44).
- `lang` theo locale (`vi` mặc định).
- Không `tabIndex=0` trên figure/decorative.

## 7. Page templates

- `Home / Solutions / Industries / Platform / Resources / Company / Contact / Legal` — mỗi template là RSC fetch từ CMS (tài liệu 06), không hardcode TSX.
- 404/500 riêng, có link về home + search.

## 8. Lint rule

Thêm eslint rule cấm hex literal ngoài `tailwind.config.ts` và cấm `style={{` inline (trừ `next/image` props).
