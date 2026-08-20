import { Suspense, lazy } from "react";
import { Skeleton } from "../components/ui";

const GoalsSection = lazy(() => import("../components/GoalsSection"));

function GoalsFallback() {
  return (
    <section aria-label="Goals loading" className="space-y-4 md:space-y-6">
      <Skeleton className="h-6 w-32 md:h-7 md:w-40" />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="rounded-xl border border-line bg-surface p-4 shadow-sm md:p-6"
          >
            {/* MOBILE: Stacks vertically (up/down). DESKTOP: Side-by-side (left/right) */}
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <Skeleton className="h-12 w-12 rounded-xl md:h-14 md:w-14 flex-shrink-0" />
              <div className="w-full space-y-2">
                <Skeleton className="h-5 w-full md:h-6 md:w-3/4" />
                <Skeleton className="h-4 w-2/3 md:h-4 md:w-1/2" />
              </div>
            </div>
            
            <Skeleton className="mt-4 h-6 w-2/5 md:mt-6" />
            <Skeleton className="mt-3 h-3 w-full rounded-full md:mt-4 md:h-3.5" />
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