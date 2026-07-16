import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
  description: "The requested BookMePro page could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-[78vh] items-center overflow-hidden bg-[#f5f1e8] px-6 pb-20 pt-32 text-[#143521] sm:pt-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(180,214,189,0.45),transparent_38%),radial-gradient(circle_at_82%_76%,rgba(242,198,109,0.24),transparent_34%)]" />

      <div className="container relative mx-auto text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#4d6f58]">
          404 error
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
          Page not found
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#45624f] sm:text-lg">
          The page may have moved, or the address may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-[#037d40] px-6 py-3 font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#026a36] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#037d40] focus:ring-offset-2 focus:ring-offset-[#f5f1e8]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
