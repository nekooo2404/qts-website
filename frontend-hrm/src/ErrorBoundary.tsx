import { Component, type ErrorInfo, type ReactNode } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class HrmErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("HRM render failure", error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="app-fallback" role="alert">
      <section className="app-fallback-card">
        <span className="app-fallback-icon" aria-hidden="true"><ExclamationTriangleIcon /></span>
        <h1>Không tải được QTS HRM</h1>
        <p>Giao diện gặp lỗi khi khởi tạo. Vui lòng tải lại trang. Nếu lỗi lặp lại, gửi thời điểm xảy ra lỗi cho quản trị viên QTS.</p>
        <button type="button" className="button button-primary" onClick={() => window.location.reload()}>Tải lại HRM</button>
      </section>
    </main>;
  }
}
