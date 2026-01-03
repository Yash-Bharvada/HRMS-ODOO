import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <main className="w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
            Dayflow HRMS
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Mock frontend ready for rapid HR flows testing.
          </h1>
          <p className="text-lg text-slate-200">
            Explore the employee and admin dashboards with pre-seeded mock data,
            or jump into the auth flows to simulate login and signup.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 font-semibold text-slate-900 shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Create account
            </Link>
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center justify-center text-sm text-slate-200 underline underline-offset-4 hover:text-white"
            >
              View admin dashboard demo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
