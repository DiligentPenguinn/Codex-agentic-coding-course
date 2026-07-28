import Link from "next/link";

export default function HomePage() {
  return (
    <main className="welcome">
      <section className="welcome-copy" aria-labelledby="welcome-title">
        <p className="eyebrow">ContentPilot</p>
        <h1 id="welcome-title">Xây quy trình nội dung của chính bạn.</h1>
        <p className="lede">
          Bắt đầu bằng thương hiệu, giọng viết và nền tảng bạn muốn phục vụ.
          Mọi dữ liệu được lưu trong workspace cục bộ.
        </p>
        <Link className="primary-action" href="/setup">
          <span>Bắt đầu thiết lập</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <aside className="welcome-note" aria-label="Điểm bắt đầu">
        <span className="note-index" aria-hidden="true">
          01
        </span>
        <div>
          <p className="micro-label">Điểm bắt đầu</p>
          <p>
            Chưa có nội dung nào được tạo. Bạn sẽ xây từng phần và kiểm chứng
            kết quả trước khi tiếp tục.
          </p>
        </div>
      </aside>
    </main>
  );
}
