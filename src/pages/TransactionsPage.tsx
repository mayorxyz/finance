import { useAppSelector } from "../redux/store";
import { TransactionsSection } from "../components/TransactionsSection";
import { Reveal } from "../components/ui";

export default function TransactionsPage() {
  const total = useAppSelector((s) => s.transactions.allIds.length);

  return (
    <div className="space-y-8">
      <Reveal>
        <header>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            Ledger
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-ink md:text-2xl">
            Transactions
          </h1>
          <p className="mt-1 max-w-xl text-sm text-soft">
            {total > 0
              ? `${total} entries across all accounts — search, filter, sort and paginate the full history.`
              : "Every debit and credit across your accounts will land here."}
          </p>
        </header>
      </Reveal>
      <TransactionsSection />
    </div>
  );
}
