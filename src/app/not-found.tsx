export default function RootNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-3 bg-card px-6">
      <p className="text-sm font-semibold text-accent-text">NEEDIT</p>
      <h1 className="text-2xl font-semibold">هذه الصفحة غير موجودة</h1>
      <p className="text-muted">We can&apos;t find that page.</p>
      <div className="mt-4 flex gap-3">
        <a
          href="/ar"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-accent-ink"
        >
          الرئيسية
        </a>
        <a
          href="/en"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-line px-5 font-semibold"
        >
          Home
        </a>
      </div>
    </main>
  );
}
