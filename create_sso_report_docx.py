from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
from html import escape
from datetime import datetime, timezone

out = Path('Bao-cao-bao-ve-SSO-QTS.docx')
NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'


def x(s):
    return escape(str(s), quote=False)


def p(text='', style=None, bold=False, italic=False):
    style_xml = f'<w:pStyle w:val="{style}"/>' if style else ''
    rpr = ''
    if bold or italic:
        rpr = '<w:rPr>' + ('<w:b/>' if bold else '') + ('<w:i/>' if italic else '') + '</w:rPr>'
    runs = []
    for i, part in enumerate(str(text).split('\n')):
        if i:
            runs.append('<w:r><w:br/></w:r>')
        runs.append(f'<w:r>{rpr}<w:t xml:space="preserve">{x(part)}</w:t></w:r>')
    return f'<w:p><w:pPr>{style_xml}</w:pPr>{"".join(runs)}</w:p>'


def bullet(text, level=0):
    return (
        '<w:p><w:pPr>'
        f'<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="{level}"/><w:numId w:val="1"/></w:numPr>'
        '</w:pPr>'
        f'<w:r><w:t xml:space="preserve">{x(text)}</w:t></w:r></w:p>'
    )


def table(rows, widths=None):
    if not rows:
        return ''
    cols = max(len(r) for r in rows)
    widths = widths or [int(9000 / cols)] * cols
    out_xml = ['<w:tbl>']
    out_xml.append('<w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>')
    out_xml.append('<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths[:cols]) + '</w:tblGrid>')
    for ri, row in enumerate(rows):
        out_xml.append('<w:tr>')
        for ci in range(cols):
            cell = row[ci] if ci < len(row) else ''
            shading = '<w:shd w:fill="D9EAF7"/>' if ri == 0 else ''
            out_xml.append('<w:tc><w:tcPr>' + shading + f'<w:tcW w:w="{widths[min(ci, len(widths)-1)]}" w:type="dxa"/></w:tcPr>')
            out_xml.append(p(cell, bold=(ri == 0)))
            out_xml.append('</w:tc>')
        out_xml.append('</w:tr>')
    out_xml.append('</w:tbl>')
    return ''.join(out_xml)


def codeblock(text):
    xml = []
    for line in str(text).strip('\n').split('\n'):
        xml.append('<w:p><w:pPr><w:pStyle w:val="CodeBlock"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">' + x(line) + '</w:t></w:r></w:p>')
    return ''.join(xml)

body = []
body.append(p('BÁO CÁO ĐÁNH GIÁ KHẢ NĂNG CHỊU TẢI & PHƯƠNG ÁN BẢO VỆ SSO', 'Title'))
body.append(p('Dự án: QTS Group Platform (qtsgroup.vn)', 'Subtitle'))
body.append(p('Hạ tầng hiện tại: VPS 103.75.185.136 - 961MiB RAM + 2GiB Swap - Single Node Docker Compose', 'Subtitle'))
body.append(p('Ngày báo cáo: 28/09/2026', 'Subtitle'))
body.append(p('Phạm vi: Đánh giá SSO (Ory Hydra + Kratos) và toàn bộ backend trước kịch bản 5.000 và 500.000 requests đồng thời', 'Subtitle'))

body.append(p('TÓM TẮT ĐIỀU HÀNH', 'Heading1'))
body.append(p('Trên hạ tầng VPS 1GB hiện tại, hệ thống không thể xử lý thành công 500.000 requests động/API/SSO đồng thời. Mục tiêu khả thi với chi phí 0đ là đảm bảo hệ thống không sập toàn bộ: phần lớn traffic được cache/chặn/drop trước khi chạm backend, request vượt ngưỡng được trả 429/503 nhanh thay vì kéo chết DB/JVM.'))
body.append(table([
    ['Kịch bản', 'Khả thi 0đ thêm', 'Kết quả kỳ vọng'],
    ['500.000 request static/assets', 'Có', 'Sống nhờ Cloudflare cache'],
    ['500.000 lượt xem landing page', 'Có một phần', 'Sống nếu HTML cache 60-300s'],
    ['5.000 người đã login đang dùng app', 'Có', 'Sống nếu API verify JWT local'],
    ['5.000 người cùng mở trang login', 'Căng', 'Cần cache + limit, một phần 429'],
    ['5.000 người cùng submit login', 'Không xử lý hết', 'SSO không sập DB, nhưng chỉ khoảng 600-800 thành công'],
    ['500.000 login/API động đồng thời', 'Không', 'Bắt buộc scale ngang + tăng tài nguyên'],
], [3000, 2200, 4300]))

body.append(p('1. HẠ TẦNG HIỆN TẠI', 'Heading1'))
body.append(p('Stack chính:', 'Heading2'))
body.append(codeblock('''Caddy (443) -> web-prod:3000 / portal-prod:5174 / hrm-prod:5175 / identity-prod:3001
            -> lead-service:18081 / event:18082 / attendance:18083 / identity-admin:18084 / identity-bridge:18085 / hrm:18086
            -> Ory Hydra:4444/4445 + Ory Kratos:4433/4434
            -> PostgreSQL (db + hydra-db + kratos-db) + Redis'''))
body.append(p('Đặc điểm quyết định:', 'Heading2'))
for item in [
    '6 service Spring Boot chạy JVM với mem_limit 192-256m + MaxRAMPercentage=75; riêng nhóm JVM có thể chiếm khoảng 1.4GB khi đủ tải.',
    '3 database PostgreSQL + 3 frontend Node + Hydra/Kratos + Redis + Caddy cùng nằm trên một host 1GB RAM.',
    'PostgreSQL max_connections mặc định thường quanh 100, dễ nghẽn khi có burst login/API.',
    'Caddy route hiện tại đã đi đúng hướng: route API lạ trả 404, không fallback rộng vào backend cũ.',
    'POST /api/v1/leads/consultation/ là endpoint public quan trọng, đã có cơ chế X-PoW chống spam.',
]:
    body.append(bullet(item))
body.append(p('Ngưỡng chịu tải thực tế ước tính:', 'Heading2'))
body.append(table([
    ['Đồng thời', 'Hiện tượng'],
    ['< 500', 'Ổn định'],
    ['1.000 - 2.000', 'Latency 2-5s, 502 rải rác'],
    ['5.000 - 10.000', 'Postgres/Hydra timeout hàng loạt'],
    ['50.000+', 'OOM, restart loop'],
    ['500.000', 'Sập hoàn toàn trong 5-15 giây'],
], [2500, 7000]))
body.append(p('Công thức RAM cho 500k: 500.000 * 20KB/socket = khoảng 10GB chỉ cho connection, chưa tính JVM/DB.'))

body.append(p('2. VAI TRÒ CỦA SSO TRONG DỰ ÁN', 'Heading1'))
body.append(p('SSO (Single Sign-On) tại sso.qtsgroup.vn là cửa chính của toàn hệ thống.'))
body.append(p('5 nhiệm vụ cốt lõi:', 'Heading2'))
for item in [
    'Đăng nhập một lần: user login tại sso.qtsgroup.vn và dùng được portal.qtsgroup.vn, hrm.qtsgroup.vn, api.qtsgroup.vn mà không cần login lại.',
    'Xác thực danh tính: kiểm tra email/password, trạng thái is_active, tenant, membership qua Ory Kratos + kratos-db.',
    'Cấp token chuẩn OIDC/OAuth2: Hydra cấp authorization_code, access_token, id_token và cung cấp OIDC discovery/JWKS.',
    'Quản lý phiên đăng nhập: session cookie, kratos_session_id, hydra_sid, security_version, logout, hết hạn và thu hồi.',
    'Làm cầu nối tin cậy: Portal/HRM/API không tự xử lý login mà tin vào token/session do SSO cấp; identity-admin-service và identity-bridge-service đồng bộ ory_id và membership.',
]:
    body.append(bullet(item))
body.append(p('Luồng chuẩn 1 user login:', 'Heading2'))
body.append(codeblock('''portal/hrm chưa có session -> 302 sso.qtsgroup.vn/login
-> identity-prod tạo Kratos login flow
-> User nhập password -> Kratos verify + tạo session (kratos-db)
-> Hydra tạo authorization code (hydra-db)
-> Callback về portal/hrm/auth/callback?code=...
-> Đổi code lấy token (Hydra)
-> Verify JWT bằng JWKS cache'''))
body.append(p('Một lần login thường tương đương 3-4 lần chạm DB, 1 lần hash Argon2 50-100ms CPU và 1 lần ký JWT. Với 5.000 login đồng thời, tải có thể tăng thành 25.000-50.000 HTTP operations và 15.000-30.000 DB operations.'))
body.append(p('Nguyên tắc vàng: SSO chỉ xử lý lúc login/logout/callback/session. Sau khi login, Portal/HRM/API phải verify JWT bằng JWKS cache, không gọi Hydra/Kratos cho mỗi API request.', bold=True))

body.append(p('3. TẠI SAO 500.000 ĐỒNG THỜI CHẮC CHẮN SẬP', 'Heading1'))
for item in [
    'SSO sập đầu tiên: mỗi login cần DB connection. hydra-db + kratos-db cùng host, max_connections khoảng 100. 500k concurrent tạo hàng chục nghìn connections, dẫn tới “too many clients”, Hydra 500 và Caddy 502.',
    'Backend sập thứ hai: HikariCP pool 10-20 connections cạn rất nhanh. JVM heap 192-256m sẽ Full GC rồi restart loop nếu queue phình lớn.',
    'Server sập hoàn toàn: file descriptors, network bandwidth và swap đều vượt giới hạn. 500k * 10KB response tương đương khoảng 5GB/s, vượt xa VPS.',
]:
    body.append(bullet(item))
body.append(p('Kết luận: ngay cả hệ thống lớn cũng không xử lý 500k concurrent trên một máy đơn. Với VPS 1GB, đây là kịch bản bất khả thi nếu request là dynamic/API/SSO.'))

body.append(p('4. PHƯƠNG ÁN 0Đ THÊM - WORKFLOW BẢO VỆ TOÀN BỘ HỆ THỐNG', 'Heading1'))
body.append(p('Triết lý: không cố xử lý hết 500k, mà lọc/chặn/cache phần lớn trước khi chạm backend.'))
body.append(codeblock('''Người dùng / Bot (500k)
  -> Cloudflare Free (DNS proxy + CDN cache + challenge bot)
    -> Firewall nftables/iptables (chỉ cho Cloudflare IP vào 80/443, drop direct-IP)
      -> Caddy (route hẹp + body limit + timeout ngắn + header cache)
        -> Frontend static-first (web/portal/hrm/identity)
          -> Backend fail-fast (Hikari pool nhỏ, timeout ngắn, queue nhỏ)
            -> PgBouncer (gom 2000 client conn -> 40 DB conn)
              -> PostgreSQL + Redis + Hydra/Kratos'''))
body.append(p('Chức năng từng lớp:', 'Heading2'))
body.append(table([
    ['Lớp', 'Chức năng bảo vệ'],
    ['Cloudflare Free', 'Che IP origin, cache static 1 tháng, cache HTML public 60-300s, cache sso/.well-known/* 5 phút, bypass auth/API, Bot Fight Mode và Under Attack Mode.'],
    ['Firewall', 'Drop truy cập trực tiếp IP origin, giới hạn connection mỗi IP, drop SYN flood ở kernel.'],
    ['Caddy', 'Route hẹp, route lạ 404, giới hạn request body 32KB cho form/login, set cache header đúng, timeout ngắn.'],
    ['Frontend', 'Static-first, landing page không gọi API khi load, chỉ gọi API khi submit form thật; giữ X-PoW chống spam.'],
    ['Backend', 'Fail-fast: pool nhỏ, timeout ngắn, queue nhỏ; đầy pool thì trả 429/503 thay vì giữ request treo.'],
    ['PgBouncer', 'Gom nhiều client connection thành số connection DB nhỏ, bảo vệ Postgres khỏi OOM và too many clients.'],
    ['fail2ban', 'Đọc log Caddy và ban IP spam 404/429/5xx liên tục trong 10-60 phút.'],
], [2200, 7300]))
body.append(p('Thứ tự bảo vệ càng trái càng rẻ: Cloudflare (0 CPU VPS) -> Firewall kernel -> Caddy 404/413/503 -> Backend 429/503 -> PgBouncer -> Postgres.'))

body.append(p('5. WORKFLOW CHI TIẾT CHO SSO KHÔNG SẬP KHI 5.000 NGƯỜI VÀO CÙNG LÚC', 'Heading1'))
body.append(p('Thiết kế 0đ cho 5.000 vào SSO:', 'Heading2'))
body.append(codeblock('''5000 request -> sso.qtsgroup.vn
 -> Cloudflare: static/discovery HIT, challenge bot -> còn khoảng 3000 vào VPS
 -> Firewall: giới hạn conn/IP -> còn khoảng 2000 vào Caddy
 -> Caddy: route lạ 404, body lớn 413, queue đầy 503 -> còn khoảng 1000 vào Kratos/Hydra
 -> Kratos/Hydra: pool PgBouncer đầy -> 429/503 nhanh
 -> Postgres: chỉ thấy khoảng 40 connection thật -> không OOM
 -> Kết quả: một phần login thành công, phần còn lại nhận 429/503 và retry được, SSO tự hồi sau burst'''))
body.append(p('Cấu hình bắt buộc áp:', 'Heading2'))
body.append(p('Caddyfile cho SSO:', 'Heading3'))
body.append(codeblock('''sso.qtsgroup.vn {
    @discovery path /.well-known/openid-configuration /.well-known/jwks.json
    header @discovery Cache-Control "public, s-maxage=300, stale-while-revalidate=60"

    @auth path /login* /registration* /self-service/* /oauth2/* /session*
    header @auth Cache-Control "no-store"

    handle @discovery {
        reverse_proxy localhost:4444 {
            header_up X-Forwarded-Proto https
        }
    }

    handle /self-service/* {
        reverse_proxy localhost:4433
    }

    handle /oauth2/* {
        reverse_proxy localhost:4444
    }

    handle {
        request_body { max_size 32KB }
        reverse_proxy localhost:3001
    }
}'''))
body.append(p('PgBouncer:', 'Heading3'))
body.append(codeblock('''[databases]
* = host=db port=5432

[pgbouncer]
pool_mode = transaction
max_client_conn = 2000
default_pool_size = 20
reserve_pool_size = 5
max_db_connections = 40'''))
body.append(p('Cloudflare:', 'Heading3'))
body.append(codeblock('''Tất cả domain proxied, SSL Full (strict)
Cache Rule 1: *.js, *.css, *.png, /_next/static/* -> 1 tháng
Cache Rule 2: sso/.well-known/* -> 5 phút
Bypass: sso/login*, /self-service/*, /oauth2/*, api/*, /auth/callback'''))
body.append(p('Tính toán giới hạn: 1 login khoảng 130ms CPU (100ms Argon2 + 20ms DB + 10ms ký JWT). 5.000 login cần khoảng 650 giây CPU. VPS 2 vCPU cần khoảng 325 giây nếu tuần tự, trong khi timeout chỉ 10s; vì vậy bắt buộc phải có queue giới hạn và trả 429/503 khi quá tải.'))

body.append(p('6. CÔNG NGHỆ ÁP DỤNG', 'Heading1'))
body.append(table([
    ['Nhóm', 'Công nghệ', 'Vai trò'],
    ['Đã có sẵn', 'Caddy', 'Reverse proxy, route hẹp, cache header, timeout/body limit'],
    ['Đã có sẵn', 'Ory Hydra', 'OAuth2/OIDC, cấp code/token, discovery/JWKS'],
    ['Đã có sẵn', 'Ory Kratos', 'Identity, password/session/self-service flow'],
    ['Đã có sẵn', 'Next.js identity-prod', 'Giao diện login/registration/account'],
    ['Đã có sẵn', 'Spring Boot', 'Identity admin/bridge và các API nghiệp vụ'],
    ['Đã có sẵn', 'PostgreSQL + Redis', 'Lưu user/session/code/token và cache phụ'],
    ['Đã có sẵn', 'Docker Compose + JVM 21', 'Runtime single-node hiện tại'],
    ['Thêm miễn phí', 'Cloudflare Free', 'CDN, DNS proxy, DDoS protection cơ bản, cache/challenge'],
    ['Thêm miễn phí', 'PgBouncer', 'Connection pooler bảo vệ Postgres'],
    ['Thêm miễn phí', 'nftables/iptables', 'Firewall kernel, chặn direct-origin và flood'],
    ['Thêm miễn phí', 'fail2ban', 'Auto-ban IP spam từ Caddy logs'],
], [1800, 2700, 5000]))
body.append(p('Giao thức/cơ chế đi kèm: TLS/HTTPS, OIDC/OAuth2 authorization code flow, JWKS, HTTP Cache-Control, Linux conntrack và ulimit.'))
body.append(p('Không dùng công nghệ trả phí: không Cloudflare Pro, không Managed DB, không Kubernetes/LB trả phí, không tăng RAM/CPU VPS.'))

body.append(p('7. PHÂN BIỆT 3 LOẠI TẢI', 'Heading1'))
body.append(table([
    ['Loại tải', '0đ có chịu được không', 'Lý do'],
    ['500k request static/landing page', 'Có', 'Cloudflare cache 95-99%, VPS chỉ nhận 1-5%'],
    ['500k bot/spam scan', 'Có thể sống sót', 'Bị chặn/drop ở Cloudflare, Caddy, firewall'],
    ['500k login/API động đồng thời', 'Không', 'Bắt buộc chạm DB/CPU/crypto, không cache được'],
], [3000, 2500, 4000]))

body.append(p('8. THIẾT KẾ ĐÚNG NẾU MUỐN 5.000 LOGIN THÀNH CÔNG THẬT', 'Heading1'))
body.append(p('Để 5.000 login đồng thời thành công thật, bắt buộc thêm tài nguyên; không có cách 0đ.'))
for item in [
    'Tách DB ra Managed PostgreSQL hoặc cụm PostgreSQL riêng, kèm PgBouncer cluster và read replica.',
    'Hydra/Kratos chạy 5-10 replica sau Load Balancer.',
    'Redis Cluster cho session/cache phụ.',
    'Spring services chạy Kubernetes/ECS với autoscaling.',
    'CDN + WAF + ALB/NLB chuyên dụng.',
    'Cụm SSO tối thiểu khoảng 8-16 vCPU và 32GB RAM tùy mục tiêu latency.',
    'Tuning Argon2 hoặc dùng flow giảm tải như OTP/magic link trong các chiến dịch burst.',
]:
    body.append(bullet(item))
body.append(p('Chi phí ước tính cho cụm chịu 5k concurrent login thật: khoảng 300-800 USD/tháng, tùy nhà cung cấp và SLA.'))

body.append(p('9. KHUYẾN NGHỊ LỘ TRÌNH', 'Heading1'))
body.append(p('Ngay lập tức, chi phí 0đ, ưu tiên cao:', 'Heading2'))
for item in [
    'Đưa toàn bộ DNS qua Cloudflare proxied và bật SSL Full (strict).',
    'Thiết lập Cache Rule và Bypass Rule đúng cho static, discovery/JWKS, API và auth.',
    'Chặn direct-IP origin bằng nftables/iptables, chỉ cho Cloudflare IP vào 80/443.',
    'Sửa Caddyfile cho SSO theo hướng route hẹp, cache discovery, no-store auth, body limit và timeout ngắn.',
    'Thêm PgBouncer và chuyển DSN dịch vụ qua PgBouncer khi tương thích.',
    'Cấu hình backend fail-fast: pool nhỏ, timeout ngắn, queue nhỏ.',
]:
    body.append(bullet(item))
body.append(p('Ngắn hạn, chi phí 0đ, theo dõi:', 'Heading2'))
for item in [
    'Bật fail2ban đọc log Caddy để ban IP spam.',
    'Chạy load test k6/wrk mức 1k-5k để lấy baseline thật.',
    'Theo dõi cache hit ratio, CPU/RAM/swap, DB connections, 429/5xx, container restarts.',
]:
    body.append(bullet(item))
body.append(p('Dài hạn khi có nhu cầu kinh doanh 5k login thành công thật:', 'Heading2'))
for item in [
    'Tách DB và scale Hydra/Kratos khỏi VPS single-node.',
    'Đưa backend/SSO lên hạ tầng autoscaling có Load Balancer.',
    'Dùng WAF/CDN trả phí nếu cần cam kết chống DDoS và rate limit nâng cao.',
]:
    body.append(bullet(item))

body.append(p('10. KẾT LUẬN', 'Heading1'))
for item in [
    'SSO làm nhiệm vụ trung tâm: xác thực danh tính, cấp token, quản lý session cho Portal/HRM/API. Nếu SSO sập, user mới không login được.',
    '5.000 người cùng vào SSO là tải nặng vì mỗi login gồm nhiều HTTP operations, DB operations, hashing và token signing.',
    'Phương án 0đ khả thi nhất là Cloudflare Free + firewall chặn direct-IP + Caddy route hẹp + PgBouncer + backend fail-fast.',
    'Mục tiêu của phương án 0đ là SSO không sập toàn bộ; chấp nhận 429/503 cho phần vượt ngưỡng thay vì để OOM.',
    'Giới hạn cứng: không thể biến VPS 1GB thành hệ thống 500k login/API thành công đồng thời. Muốn 5.000 login thành công thật phải scale ngang và tăng tài nguyên.',
]:
    body.append(bullet(item))
body.append(p('Một dòng tóm tắt:', 'Heading2'))
body.append(codeblock('''User/Bot -> Cloudflare cache/challenge -> Firewall chỉ cho Cloudflare vào -> Caddy route hẹp + timeout/body limit -> Frontend static-first -> Backend fail-fast -> PgBouncer giới hạn DB -> Quá tải trả 429/503 thay vì sập server.'''))
body.append(p('Báo cáo này là cơ sở để quyết định: giữ phương án 0đ chống sập, hay đầu tư hạ tầng scale cho kịch bản 5.000-500.000 concurrent thành công.', italic=True))

sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
document = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{NS_W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>{''.join(body)}{sect}</w:body>
</w:document>'''

styles = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{NS_W}">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1F4E79"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr><w:rPr><w:sz w:val="21"/><w:color w:val="404040"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F4E79"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="2F5597"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="3D5A80"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="CodeBlock"><w:name w:val="Code Block"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:fill="F2F2F2"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/></w:rPr></w:style>
  <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="39"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/></w:tblBorders></w:tblPr></w:style>
</w:styles>'''

numbering = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="{NS_W}">
  <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>'''

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''

doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>'''

now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
core = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Báo cáo bảo vệ SSO QTS</dc:title>
  <dc:subject>Đánh giá khả năng chịu tải và phương án bảo vệ SSO</dc:subject>
  <dc:creator>Claude</dc:creator>
  <cp:lastModifiedBy>Claude</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>'''

app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Word</Application>
</Properties>'''

settings = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="{NS_W}"><w:defaultTabStop w:val="720"/></w:settings>'''

with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    z.writestr('word/document.xml', document)
    z.writestr('word/styles.xml', styles)
    z.writestr('word/numbering.xml', numbering)
    z.writestr('word/settings.xml', settings)
    z.writestr('docProps/core.xml', core)
    z.writestr('docProps/app.xml', app)

print(out.resolve())
print(f'{out.stat().st_size} bytes')
