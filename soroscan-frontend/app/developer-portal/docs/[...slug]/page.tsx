import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/terminal/landing/Navbar";
import { Footer } from "@/components/terminal/landing/Footer";
import { SDKDocumentation, DOC_NAV } from "@/components/developer/SDKDocumentation";
import { getDocContent, ALL_DOC_SLUGS } from "@/lib/docs-content";

interface PageParams {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return ALL_DOC_SLUGS.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const slugStr = slug.join("/");

  // Find nav item for title
  let title = slugStr;
  for (const section of DOC_NAV) {
    const item = section.items.find((i) => i.slug === slugStr);
    if (item) {
      title = item.title;
      break;
    }
  }

  return {
    title: `${title} — SoroScan Developer Docs`,
    description: `SoroScan developer documentation: ${title}`,
  };
}

export default async function DocPage({ params }: PageParams) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  const content = getDocContent(slugStr);
  if (content.startsWith("# Not Found")) {
    notFound();
  }

  return (
    <div className="min-h-screen font-terminal-mono bg-terminal-black text-terminal-green">
      <Navbar />
      <div className="border-b border-terminal-green/20 px-6 py-2 flex items-center gap-2 text-xs">
        <a href="/developer-portal" className="text-terminal-gray hover:text-terminal-cyan">
          Developer Portal
        </a>
        <span className="text-terminal-gray/40">/</span>
        <a href="/developer-portal/docs" className="text-terminal-gray hover:text-terminal-cyan">
          Docs
        </a>
        <span className="text-terminal-gray/40">/</span>
        <span className="text-terminal-green">{slugStr}</span>
      </div>
      <div className="container mx-auto max-w-7xl" style={{ height: "calc(100vh - 120px)" }}>
        <SDKDocumentation slug={slugStr} content={content} />
      </div>
      <div className="container mx-auto px-6 max-w-7xl py-8">
        <Footer />
      </div>
    </div>
  );
}
