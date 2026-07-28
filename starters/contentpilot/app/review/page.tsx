import { EmptyState } from "@/components/EmptyState";

export default function ReviewPage() {
  return (
    <main className="route-page">
      <EmptyState
        eyebrow="Duyệt bài"
        title="Chưa có nội dung để duyệt."
        description="Chỉ những gói nội dung được tạo và lưu thật mới xuất hiện tại đây."
      />
    </main>
  );
}
