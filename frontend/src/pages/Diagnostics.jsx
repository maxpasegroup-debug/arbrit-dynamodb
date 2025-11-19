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
  const [resetResult, setResetResult] = useState(null);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResult, setSearchResult] = useState(null);

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

  const cleanupDemoUsers = async () => {
    if (!window.confirm('This will DELETE all demo/test users with fake mobile numbers (like 0123456789). Continue?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/cleanup-demo-users`);
      setResetResult(response.data);
      // Refresh diagnostics after cleanup
      setTimeout(() => runAllChecks(), 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const resetDefaultUsers = async () => {
    setLoading(true);
    setError(null);
    setResetResult(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/admin/reset-default-users`);
      setResetResult(response.data);
      // Refresh diagnostics after reset
      setTimeout(() => runAllChecks(), 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const checkUserExists = async () => {
    if (!searchMobile) return;
    setLoading(true);
    setSearchResult(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/check-user/${searchMobile}`);
      setSearchResult(response.data);
    } catch (err) {
      setSearchResult({ exists: false, error: err.message });
    }
    setLoading(false);
  };

  const deleteSpecificUser = async (mobile) => {
    if (!window.confirm(`Are you sure you want to DELETE user with mobile ${mobile}? This cannot be undone!`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.delete(`${BACKEND_URL}/api/admin/delete-user/${mobile}`);
      setResetResult(response.data);
      // Refresh diagnostics after deletion
      setTimeout(() => runAllChecks(), 1000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
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

        {/* User Search Tool */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Search for User by Mobile
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter mobile number (e.g., 971564022503)"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              onClick={checkUserExists}
              disabled={loading || !searchMobile}
              className="px-6"
            >
              Search
            </Button>
          </div>
          
          {searchResult && (
            <div className={`mt-4 p-4 rounded-lg ${searchResult.exists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {searchResult.exists ? (
                <div>
                  <p className="font-semibold text-green-900 mb-2">✅ User Found!</p>
                  <p className="text-sm text-green-800"><strong>Name:</strong> {searchResult.user.name}</p>
                  <p className="text-sm text-green-800"><strong>Role:</strong> {searchResult.user.role}</p>
                  <p className="text-sm text-green-800"><strong>Mobile:</strong> {searchResult.user.mobile}</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-900 mb-2">❌ User Not Found</p>
                  <p className="text-sm text-red-800">{searchResult.message || searchResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cleanup Demo Users */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-900">🗑️ Delete Demo/Test Users</h2>
          <p className="text-sm text-red-800 mb-4">
            <strong>IMPORTANT:</strong> Your database has demo users with fake mobile numbers (like 0123456789, 0550000001, etc.) that are conflicting with real users. Click below to delete ALL demo users.
          </p>
          <Button
            onClick={cleanupDemoUsers}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete All Demo Users
          </Button>
        </div>

        {/* Reset Default Users */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">🔧 Reset MD & COO Credentials</h2>
          <p className="text-sm text-yellow-800 mb-4">
            After cleaning up demo users, click here to create fresh MD and COO users with correct credentials.
          </p>
          <Button
            onClick={resetDefaultUsers}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Reset MD & COO Users
          </Button>
          
          {resetResult && (
            <div className={`mt-4 p-4 rounded-lg ${resetResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {resetResult.success ? (
                <div>
                  <p className="font-semibold text-green-900 mb-2">✅ {resetResult.message}</p>
                  {resetResult.deleted_count !== undefined && (
                    <p className="text-sm text-green-800 mb-2">Deleted {resetResult.deleted_count} demo users</p>
                  )}
                  {resetResult.deleted_users && resetResult.deleted_users.map((user, idx) => (
                    <p key={idx} className="text-xs text-green-700">{user}</p>
                  ))}
                  {resetResult.results && resetResult.results.map((result, idx) => (
                    <p key={idx} className="text-sm text-green-800">{result}</p>
                  ))}
                  {resetResult.instructions && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-300">
                      <p className="text-sm font-semibold text-green-900 mb-1">You can now login with:</p>
                      <p className="text-sm text-green-800">• MD: 971564022503 / PIN: 2503</p>
                      <p className="text-sm text-green-800">• COO: 971566374020 / PIN: 4020</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-900 mb-2">❌ {resetResult.message}</p>
                  <p className="text-sm text-red-800">{resetResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Users List */}
        {diagnostics && diagnostics.all_users && diagnostics.all_users.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              All Users in Database ({diagnostics.all_users.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              These are ALL the users in your production database. Search for the mobile number you're trying to use.
            </p>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Mobile</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnostics.all_users.map((user, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{user.mobile}</td>
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <li>🔍 <strong>Search User:</strong> Check if a specific mobile number exists</li>
            <li>🔧 <strong>Reset Users:</strong> Fix MD & COO credentials if login fails</li>
            <li>📋 <strong>Share this info:</strong> Screenshot this page if you need support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
