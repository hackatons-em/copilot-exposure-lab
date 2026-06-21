import Link from "next/link";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/config";

const SAMPLE_REPORT_URL =
  "https://github.com/hackatons-em/copilot-exposure-lab/blob/main/docs/sample-report/acme-exposure-report.md";

/**
 * Shared marketing/credibility footer. Trust + research + developer surfaces live
 * here (deliberately not in the app's left-rail nav) so the product itself stays
 * focused on the assess → prove → act → govern spine.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-surface-subtle/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <Logo />
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            Independent product. Does not replace Microsoft Purview, Defender, or SharePoint Advanced Management.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Link href="/security" className="text-ink-soft no-underline transition-colors hover:text-ink">
            Security
          </Link>
          <Link href="/research" className="text-ink-soft no-underline transition-colors hover:text-ink">
            Research
          </Link>
          <a
            href={SAMPLE_REPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft no-underline transition-colors hover:text-ink"
          >
            Sample report
          </a>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft no-underline transition-colors hover:text-ink"
          >
            API reference
          </a>
        </nav>
      </div>
    </footer>
  );
}
