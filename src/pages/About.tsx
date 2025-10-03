// About component that displays comprehensive OAuth Playground documentation
export default function About() {
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-indigo-600 text-4xl">📚</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              OAuth Playground Documentation
            </h1>
            <p className="text-gray-600 mt-2">
              Complete guide to what the OAuth Playground does and how to use it
            </p>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Overview */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Overview</h2>
          <p className="text-gray-700 mb-4">
            The <strong>PingOne OAuth 2.0 & OpenID Connect Playground</strong> is an interactive web application designed to help developers learn, test, and master OAuth 2.0 and OpenID Connect (OIDC) flows using PingOne as the identity provider.
          </p>
        </div>

        {/* What You Can Do */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎮 What You Can Do</h2>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">Interactive OAuth Flows</h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-2">Authorization Code Flow</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Learn the complete OAuth authorization code flow</li>
                <li>• Interactive PKCE (Proof Key for Code Exchange) generation</li>
                <li>• Real-time authorization URL building</li>
                <li>• Step-by-step token exchange demonstration</li>
                <li>• Token validation and inspection</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-blue-700 mb-2">Client Credentials Flow</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Machine-to-machine authentication</li>
                <li>• Client secret and private key JWT methods</li>
                <li>• Token introspection and validation</li>
                <li>• Scope-based access control</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-purple-700 mb-2">Device Code Flow</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• IoT and input-constrained device authentication</li>
                <li>• Interactive device code generation</li>
                <li>• Polling-based token retrieval</li>
                <li>• Real-time status updates</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-orange-700 mb-2">Advanced Flows</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• JWT Bearer Token Flow</li>
                <li>• Rich Authorization Requests (RAR)</li>
                <li>• Client Initiated Backchannel Authentication (CIBA)</li>
                <li>• Redirectless Flow with pi.flow</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-4">OpenID Connect Integration</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">User Authentication</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Complete OIDC login flows</li>
                <li>• ID token validation and parsing</li>
                <li>• User profile information retrieval</li>
                <li>• Session management</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Enhanced Security</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• PKCE implementation</li>
                <li>• State parameter protection</li>
                <li>• Nonce validation</li>
                <li>• Token refresh mechanisms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Educational Features */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎨 Educational Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Interactive Learning</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✅ <strong>Step-by-Step Guides:</strong> Each flow includes detailed explanations</li>
                <li>✅ <strong>Visual Flow Diagrams:</strong> See how OAuth messages flow between parties</li>
                <li>✅ <strong>Code Examples:</strong> Copy-paste ready code snippets</li>
                <li>✅ <strong>Best Practices:</strong> Security recommendations and implementation tips</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Multiple Flow Versions</h3>
              <ul className="space-y-2 text-gray-600">
                <li>🔄 <strong>V1-V4 Flows:</strong> Educational versions with detailed explanations</li>
                <li>🚀 <strong>V5 Flows:</strong> Production-ready implementations</li>
                <li>🛠️ <strong>Custom Flows:</strong> Build your own OAuth flows</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Developer Tools */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🛠️ Developer Tools</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">Token Analysis</h3>
              <ul className="space-y-2 text-indigo-800">
                <li>🔍 <strong>JWT Decoder:</strong> Decode and inspect JWT tokens</li>
                <li>🔎 <strong>Token Introspection:</strong> Query token validity and metadata</li>
                <li>📋 <strong>Claims Inspection:</strong> View token payload contents</li>
                <li>✅ <strong>Signature Validation:</strong> Verify token authenticity</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">API Testing</h3>
              <ul className="space-y-2 text-green-800">
                <li>🌐 <strong>Endpoint Discovery:</strong> Browse available API endpoints</li>
                <li>🔧 <strong>Request Builder:</strong> Construct API calls with proper authentication</li>
                <li>📊 <strong>Response Analysis:</strong> Inspect API responses and headers</li>
                <li>⚠️ <strong>Error Simulation:</strong> Test error conditions and handling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h3 className="text-xl font-bold mb-4">📈 Impact & Reach</h3>
          <p className="text-indigo-100 mb-6">
            The OAuth Playground has helped thousands of developers master OAuth concepts through interactive learning.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">15+</div>
              <div className="text-sm text-indigo-200">OAuth Flows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">V1-V5</div>
              <div className="text-sm text-indigo-200">Flow Versions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-sm text-indigo-200">Interactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">∞</div>
              <div className="text-sm text-indigo-200">Learning</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
