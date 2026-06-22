import Link from "next/link";
import { Logo } from "@/components/Logo";
import { API_URL } from "@/lib/config";

const SAMPLE_REPORT_URL = "/sample-report.html";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/product", label: "Product tour" },
      { href: "/pricing", label: "Pricing" },
      { href: "/overview", label: "Open the dashboard" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { href: "/security", label: "Security & posture" },
      { href: "/research", label: "Research" },
      { href: "https://github.com/hackatons-em/copilot-exposure-lab/blob/main/SECURITY.md", label: "Disclosure policy", external: true },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: SAMPLE_REPORT_URL, label: "Sample report", external: true },
      { href: `${API_URL}/docs`, label: "API reference", external: true },
      { href: "https://github.com/hackatons-em/copilot-exposure-lab", label: "GitHub", external: true },
    ],
  },
];

function FooterLinkEl({ link }: { link: FooterLink }) {
  const cls = "text-ink-soft no-underline transition-colors hover:text-ink";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noreferrer" className={cls}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={cls}>
      {link.label}
    </Link>
  );
}

/**
 * Shared marketing footer. Trust + research + developer surfaces live here
 * (deliberately not in the app's left-rail nav) so the product itself stays
 * focused on the assess → prove → act → govern spine.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-surface-subtle/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            Know what Microsoft 365 Copilot would expose before you turn it on. Read-only, built for Microsoft, and it
            never reads your file contents.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="eyebrow mb-3">{col.heading}</p>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <FooterLinkEl link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-ink-faint md:flex-row md:items-center md:justify-between">
          <span>© 2026 Copilot Exposure Lab. Independent product.</span>
          <span>Does not replace Microsoft Purview, Defender, or SharePoint Advanced Management.</span>
        </div>
      </div>
    </footer>
  );
}
