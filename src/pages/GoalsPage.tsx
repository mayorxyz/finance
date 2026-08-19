import { Suspense, lazy } from "react";
import { Skeleton } from "../components/ui";

const GoalsSection = lazy(() => import("../components/GoalsSection"));

function GoalsFallback() {
  return (
    <section aria-label="Goals loading" className="space-y-5">
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="mt-5 h-6 w-2/5" />
            <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsFallback />}>
      <GoalsSection />
    </Suspense>
  );
}
