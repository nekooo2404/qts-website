import { getCuratedSources } from "@/lib/curated-sources";

export default function CuratedSourceList({ sourceIds }: { sourceIds: string[] }) {
  const sources = getCuratedSources(sourceIds);
  if (sources.length === 0) return null;
  return (
    <section className="curated-sources" aria-labelledby="curated-sources-title">
      <h2 id="curated-sources-title">Nguồn chính thức để đọc sâu</h2>
      <p className="curated-sources-note">
        Các liên kết dưới đây dẫn tới trang chính thức của nhà xuất bản. QTS chỉ tóm tắt ngắn gọn bằng tiếng Việt để định hướng đọc sâu; không sao chép nội dung, sơ đồ hay tài sản của bên thứ ba.
      </p>
      <ul className="curated-sources-list">
        {sources.map((source) => (
          <li key={source.id} className="curated-source-item">
            <span className="curated-source-publisher">{source.publisher}</span>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="curated-source-link">
              {source.title}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (mở trong tab mới)</span>
            </a>
            <p className="curated-source-relevance">{source.relevance}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
