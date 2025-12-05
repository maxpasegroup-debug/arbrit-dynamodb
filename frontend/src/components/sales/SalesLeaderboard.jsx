import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Award, Medal, TrendingUp } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const SalesLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/sales/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLeaderboard(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Award className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{rank}</div>;
    }
  };

  const getRankBadge = (rank) => {
    const colors = {
      1: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
      2: 'bg-slate-500/20 border-gray-400/50 text-gray-300',
      3: 'bg-amber-600/20 border-amber-600/50 text-amber-400'
    };
    return colors[rank] || 'bg-white border-white/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <p className="text-gray-400">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/20">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">🏆 Sales Performance Leaderboard</h3>
        </div>
        <p className="text-sm text-gray-400 mt-1">Top performers this month</p>
      </div>

      <div className="p-6">
        {leaderboard.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No data yet. Start creating leads!</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((person, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser && person.employee_id === currentUser.id;
              
              return (
                <div
                  key={person.employee_id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    isCurrentUser 
                      ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30' 
                      : getRankBadge(rank)
                  }`}
                >
                  {/* Rank Icon */}
                  <div className="flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white truncate">
                        {person.name}
                        {isCurrentUser && <span className="text-blue-400 ml-2">(You)</span>}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400">{person.designation || person.department}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-white">{person.total_leads}</p>
                      <p className="text-xs text-gray-400">leads</p>
                    </div>
                    {person.converted_leads > 0 && (
                      <p className="text-xs text-green-400">
                        {person.converted_leads} converted
                      </p>
                    )}
                  </div>

                  {/* Conversion Rate */}
                  {person.conversion_rate > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-400">
                        {person.conversion_rate}%
                      </p>
                      <p className="text-xs text-gray-500">rate</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-xs text-center text-gray-500">
              Rankings based on total leads created and conversion rate
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesLeaderboard;
