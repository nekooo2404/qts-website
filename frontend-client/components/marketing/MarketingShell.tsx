import RouteScrollReset from "./RouteScrollReset";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteScrollReset />
      <a href="#main-content" className="skip-link">Bỏ qua điều hướng</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </>
  );
}
