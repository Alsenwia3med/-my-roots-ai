import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ROOTS-AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive Health Assessment Platform
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome to Your Health Assessment
            </h2>
            <p className="text-gray-600 mb-6">
              This assessment consists of 73 questions across 13 modules covering various aspects of your health.
              The results will provide insights into 7 key health domains with personalized recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">73</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-green-600">13</div>
                <div className="text-sm text-gray-600">Modules</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">7</div>
                <div className="text-sm text-gray-600">Health Domains</div>
              </div>
            </div>
            <div className="space-x-4">
              <Link
                href="/auth"
                className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Sign In / Sign Up
              </Link>
              <Link
                href="/assessment"
                className="inline-block bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Start Assessment
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>This assessment is for informational purposes only and does not constitute medical advice.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
