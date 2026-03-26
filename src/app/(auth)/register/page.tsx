import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">📝 Plate Notion</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-700">Registration</h2>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            Registration is disabled. Please contact your administrator to create an account.
          </p>
          <Link
            href="/login"
            className="inline-block py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
