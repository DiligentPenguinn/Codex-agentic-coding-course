import { EmptyState } from "@/components/EmptyState";

export default function SetupPage() {
  return (
    <main className="route-page">
      <EmptyState
        eyebrow="Thiết lập"
        title="Chưa có hồ sơ thương hiệu."
        description="Bạn sẽ xây biểu mẫu và lưu dữ liệu thương hiệu trong Module 2."
      />
    </main>
  );
}
