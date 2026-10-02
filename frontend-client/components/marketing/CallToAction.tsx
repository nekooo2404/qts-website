import Link from "next/link";
import Reveal from "./Reveal";

export default function CallToAction({ title = "Xây dựng lợi thế số tiếp theo.", copy = "Chia sẻ bài toán doanh nghiệp đang cần giải quyết. QTS sẽ phản hồi trong ngày làm việc." }: { title?: string; copy?: string }) {
  return <section className="cta-band"><div className="container cta-inner">
    <Reveal><div className="cta-copy"><h2>{title}</h2><p>{copy}</p></div></Reveal>
    <Reveal delay={0.15}><Link href="/contact" className="btn btn-light">Yêu cầu tư vấn</Link></Reveal>
  </div></section>;
}
