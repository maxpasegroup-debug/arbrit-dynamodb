import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Database, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Diagnostics = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health`);
      setHealthStatus(response.data);
    } catch (err) {
      setError(err.message);
      setHealthStatus(null);
    }
    setLoading(false);
  };

  const checkDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/diagnostics`);
      setDiagnostics(response.data);
    } catch (err) {
      setError(err.message);
      setDiagnostics(null);
    }
    setLoading(false);
  };

  const runAllChecks = async () => {
    await checkHealth();
    await checkDiagnostics();
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  const StatusBadge = ({ status }) => {
    if (status === 'healthy' || status === 'connected') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">{status.toUpperCase()}</span>
        </div>
      );
    } else if (status === 'unhealthy' || status === 'disconnected' || status === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">{status.toUpperCase()}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">UNKNOWN</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">System Diagnostics</h1>
              <p className="text-gray-600">Backend and Database Health Check</p>
            </div>
            <Button
              onClick={runAllChecks}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Backend URL */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Backend Configuration
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Backend URL:</p>
            <p className="text-lg font-mono text-gray-900">{BACKEND_URL}</p>
          </div>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Health Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Backend Status:</span>
                <StatusBadge status={healthStatus.status} />
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Database Status:</span>
                <StatusBadge status={healthStatus.database} />
              </div>
              {healthStatus.user_count !== undefined && (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total Users:</span>
                  <span className="text-lg font-bold text-blue-600">{healthStatus.user_count}</span>
                </div>
              )}
              {healthStatus.mongo_url && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">MongoDB Host:</p>
                  <p className="font-mono text-sm text-gray-900">{healthStatus.mongo_url}</p>
                </div>
              )}
              {healthStatus.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 mb-1 font-semibold">Error:</p>
                  <p className="font-mono text-sm text-red-800">{healthStatus.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnostics */}
        {diagnostics && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Detailed Diagnostics
            </h2>
            <div className="space-y-4">
              {/* Environment */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Environment Variables</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Database Name:</span>
                    <span className="font-mono text-sm">{diagnostics.environment.db_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">CORS Origins:</span>
                    <span className="font-mono text-sm">{diagnostics.environment.cors_origins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">JWT Secret:</span>
                    <span className="font-mono text-sm">
                      {diagnostics.environment.jwt_secret_exists ? '✅ Set' : '❌ Not Set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">MongoDB URL:</span>
                    <span className="font-mono text-sm">
                      {diagnostics.environment.mongo_url_exists ? '✅ Set' : '❌ Not Set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">MongoDB Host:</span>
                    <span className="font-mono text-sm">{diagnostics.environment.mongo_host}</span>
                  </div>
                </div>
              </div>

              {/* Database Status */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Database Connection</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <StatusBadge status={diagnostics.database_status} />
                  {diagnostics.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800 font-mono">{diagnostics.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Collections */}
              {diagnostics.collections && diagnostics.collections.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Database Collections</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {diagnostics.collections.map((collection) => (
                        <span
                          key={collection}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {collection}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* User Samples */}
              {diagnostics.user_samples && diagnostics.user_samples.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">
                    Sample Users (Total: {diagnostics.total_users})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {diagnostics.user_samples.map((user, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="font-medium">{user.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">{user.mobile}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Connection Error</h3>
                <p className="text-red-800 font-mono text-sm">{error}</p>
                <p className="text-red-700 mt-3 text-sm">
                  The backend server might be down or unreachable. Please check your deployment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use This Page</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ <strong>Green Status:</strong> System is working correctly</li>
            <li>❌ <strong>Red Status:</strong> There's a problem that needs attention</li>
            <li>🔄 <strong>Click Refresh:</strong> Re-run all diagnostic checks</li>
            <li>📋 <strong>Share this info:</strong> Screenshot this page if you need support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
