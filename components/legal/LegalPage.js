import Link from "next/link";

export default function LegalPage({ eyebrow, title, intro, updated, children }) {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#10311f]">
      <section className="relative overflow-hidden pb-14 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(180,214,189,0.45),transparent_38%),radial-gradient(circle_at_82%_75%,rgba(242,198,109,0.24),transparent_34%)]" />
        <div className="container relative mx-auto px-6 md:px-20">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-[#cddfcf] bg-[#edf5ef] px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#4d6f58]">
              {eyebrow}
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#365542]">
              {intro}
            </p>
            <p className="mt-4 text-sm text-[#5a7563]">Last updated: {updated}</p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6 md:px-20">
          <article className="mx-auto max-w-4xl rounded-[2rem] border border-[#d8e3d8] bg-white p-6 shadow-[0_20px_60px_rgba(16,49,31,0.08)] sm:p-10">
            <div className="space-y-9 text-base leading-8 text-[#365542] [&_a]:font-medium [&_a]:text-[#037d40] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-[#143521] [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2">
              {children}
            </div>
            <div className="mt-12 flex flex-wrap gap-3 border-t border-[#d8e3d8] pt-6 text-sm">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/contact">Contact BookMePro</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
