"use client";
export default function AccountError({ reset }: { reset: () => void }) {
  return <main className="ambient-login"><section className="login-card"><h1>Chưa tải được hồ sơ</h1><p role="alert">Không thể xác minh phiên hoặc tải dữ liệu tài khoản. Vui lòng thử lại.</p><button className="primary-action" onClick={reset}>Thử lại</button></section></main>;
}
