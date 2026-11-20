import { AppShell } from "@/components/app-shell";
import { ReportList } from "@/components/report-list";
import { reports } from "@/lib/domain/fixtures";

export default function ReportsPage() {
  const initialPage = {
    data: reports.slice(0, 1),
    meta: {
      nextCursor: "REP-2040",
      hasMore: true,
    },
  };

  const handleFetchPage = async (cursor?: string) => {
    // In a real app, this would call the API
    // For now, simulate pagination with fixtures
    if (!cursor) {
      return initialPage;
    }

    const index = reports.findIndex((r) => r.id === cursor);
    if (index === -1) {
      throw new Error("Invalid cursor");
    }

    const pageSize = 1;
    const nextIndex = index + pageSize;
    const hasMore = nextIndex < reports.length;

    return {
      data: reports.slice(index, index + pageSize),
      meta: {
        nextCursor: hasMore ? reports[nextIndex]?.id : undefined,
        hasMore,
      },
    };
  };

  return (
    <AppShell
      title="Reports"
      description="Canonical verification reports issued by the backend."
    >
      <ReportList initialData={initialPage} onFetchPage={handleFetchPage} />
    </AppShell>
  );
}

