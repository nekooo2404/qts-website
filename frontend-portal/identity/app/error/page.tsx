import Link from "next/link";
export default function Page() {
  return <main className="ambient-login"><section className="login-card"><h1>Không thể hoàn tất yêu cầu</h1><p>Yêu cầu có thể đã hết hạn. Hãy bắt đầu lại hoặc liên hệ quản trị viên nếu lỗi tiếp diễn.</p><Link href="/login" className="primary-action">Đăng nhập lại</Link></section></main>;
}
