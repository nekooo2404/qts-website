import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";
export default function Page() {
  if (process.env.ORY_EMAIL_FLOWS_ENABLED !== "true") return <main className="ambient-login"><section className="login-card"><h1>Hỗ trợ tài khoản</h1><p>Khôi phục qua email hiện chưa được cấu hình. Vui lòng liên hệ quản trị viên để được hỗ trợ.</p><Link href="/login">Quay lại đăng nhập</Link></section></main>;
  return <SignInForm kind="verification" emailFlowsEnabled/>;
}
