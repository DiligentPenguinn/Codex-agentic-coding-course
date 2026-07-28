import { EmptyState } from "@/components/EmptyState";

export default function WorkflowPage() {
  return (
    <main className="route-page">
      <EmptyState
        eyebrow="Workflow"
        title="Chưa có batch nội dung."
        description="Nghiên cứu, ý tưởng và bản thảo sẽ xuất hiện sau khi bạn xây workflow thật."
      />
    </main>
  );
}
