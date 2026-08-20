import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { cx } from "../utils/format";
import { Icon } from "./icons";
import { NAV_ITEMS } from "./Header";

function TabLink({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      aria-label={item.label}
      className={({ isActive }) =>
        cx(
          "relative flex flex-col items-center gap-1 pb-2.5 pt-2 text-[10px] font-bold transition-colors",
          isActive ? "text-brand-700" : "text-soft hover:text-ink",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cx(
              "absolute top-0 h-[3px] w-9 rounded-b-full bg-brand-600 transition-all duration-300",
              isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
            )}
          />
          <Icon name={item.icon} className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.3 : 1.8} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

/**
 * Bottom navigation for phones & tablets.
 * Order: Overview · Analytics · [Add] · Transactions · Goals
 */
export function MobileTabBar({ onAdd }: { onAdd: () => void }) {
  const [overview, analytics, transactions, goals] = NAV_ITEMS;
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 items-center border-t border-line bg-surface/95 shadow-[0_-6px_20px_rgba(16,24,40,0.07)] backdrop-blur">
        <TabLink item={overview} />
        <TabLink item={analytics} />
        
        {/* Standardized, inline add button */}
        <div className="flex flex-col items-center justify-center pb-2.5 pt-2">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add transaction"
            className="flex flex-col items-center gap-1 text-[10px] font-bold text-soft transition-colors hover:text-brand-600 active:scale-95"
          >
            <span className="flex h-[21px] w-[21px] items-center justify-center rounded-full bg-brand-600 text-white">
              <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add
          </button>
        </div>

        <Fragment key={transactions.id}>
          <TabLink item={transactions} />
        </Fragment>
        <TabLink item={goals} />
      </div>
    </nav>
  );
}