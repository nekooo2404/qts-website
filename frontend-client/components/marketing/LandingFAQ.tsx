import Link from "next/link";

const questions = [
  {
    question: "QTS bắt đầu một dự án công nghệ như thế nào?",
    answer: "QTS bắt đầu bằng việc làm rõ mục tiêu, quy trình hiện có, các hệ thống liên quan và ràng buộc cần ưu tiên. Bước này giúp hai bên xác định phạm vi phù hợp trước khi đi sâu vào thiết kế và lộ trình thực hiện.",
  },
  {
    question: "QTS có thể phát triển những loại hệ thống nào?",
    answer: "QTS tập trung vào phần mềm doanh nghiệp, nền tảng phần mềm, ứng dụng web, giải pháp AI, dữ liệu và hạ tầng đám mây. Phạm vi cụ thể được định hình theo bài toán và bối cảnh vận hành của từng tổ chức.",
  },
  {
    question: "Giai đoạn khám phá giúp làm rõ những gì?",
    answer: "Giai đoạn khám phá làm rõ người dùng, luồng công việc, nguồn dữ liệu, điểm tích hợp, yêu cầu kiểm soát và các ưu tiên triển khai. Đây là cơ sở để lựa chọn phương án kỹ thuật và kế hoạch phù hợp.",
  },
  {
    question: "Làm thế nào để trao đổi với QTS về một nhu cầu cụ thể?",
    answer: "Bạn có thể gửi bối cảnh, mục tiêu và những hệ thống đang sử dụng qua trang liên hệ. QTS sẽ dùng các thông tin đó để chuẩn bị cho cuộc trao đổi ban đầu.",
  },
] as const;

export default function LandingFAQ() {
  return <section className="section landing-faq" aria-labelledby="landing-faq-title">
    <div className="container faq-grid">
      <div className="section-heading">
        <span className="eyebrow">Câu hỏi thường gặp</span>
        <h2 id="landing-faq-title">Những điều cần làm rõ trước khi bắt đầu.</h2>
        <p>Một số câu hỏi thường xuất hiện khi đội ngũ đang đánh giá một nền tảng hoặc dự án công nghệ mới.</p>
        <Link href="/contact" className="faq-contact">Trao đổi về bài toán của bạn →</Link>
      </div>
      <div className="faq-list">
        {questions.map(({ question, answer }) => <details key={question} className="faq-item">
          <summary>{question}<span aria-hidden="true" /></summary>
          <p>{answer}</p>
        </details>)}
      </div>
    </div>
  </section>;
}
