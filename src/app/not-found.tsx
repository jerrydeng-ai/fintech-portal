import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Not found</h1>
      <p className="mt-1 text-sm text-slate-600">That record does not exist.</p>
      <Link href="/kyc" className="mt-4 inline-block text-sm font-medium text-blue-600">
        Back to the review queue
      </Link>
    </div>
  );
}
