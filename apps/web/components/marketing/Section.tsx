import type { ReactNode } from "react";

export default function Section({ id, dark = false, tinted = false, className = "", children }: { id?: string; dark?: boolean; tinted?: boolean; className?: string; children: ReactNode }) {
  return <section id={id} className={`section${dark ? " dark" : ""}${tinted ? " case-study" : ""} ${className}`.trim()}><div className="container">{children}</div></section>;
}
