import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Medal, Award, Calendar, Clock, Target, TrendingUp, User, Star, RefreshCw, Plus, Loader2 } from 'lucide-react';

const StudentRankingDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', name: '' });
  const [addingUser, setAddingUser] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortType, setSortType] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');

  // API Base URL - Update this to your backend URL
  const API_BASE = 'http://localhost:3000';

  // Fetch rankings based on type
  const fetchRankings = async (type = 'today') => {
    try {
      const response = await fetch(`${API_BASE}/ranking?type=${type}`);
      const data = await response.json();
      
      if (data.results) {
        // Transform backend data to match frontend structure
        const transformedData = data.results.map((result, index) => ({
          id: result._id,
          name: result.username, // Using username as name for now
          username: result.username,
          avatar: result.username.substring(0, 2).toUpperCase(),
          totalSolved: result.totalCount,
          dailyScore: type === 'today' ? result.totalCount : 0,
          weeklyScore: type === 'this_week' ? result.totalCount : 0,
          monthlyScore: type === 'this_month' ? result.totalCount : 0,
          overallScore: type === 'total' ? result.totalCount : 0,
          difficulty: {
            easy: result.easy || 0,
            medium: result.medium || 0,
            hard: result.hard || 0
          },
          rank: index + 1,
          lastActive: 'Recently', // Default value since backend doesn't provide this
          streak: Math.floor(Math.random() * 30) + 1 // Mock streak data
        }));
        setStudents(transformedData);
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError('Failed to fetch rankings');
      console.error('Error fetching rankings:', err);
    }
  };

  // Fetch total stats for overall ranking
  const fetchTotalStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/total-leaderboard`);
      const data = await response.json();
      
      if (data.stats) {
        const transformedData = data.stats.map((stat, index) => ({
          id: stat.user,
          name: stat.username,
          username: stat.username,
          avatar: stat.username.substring(0, 2).toUpperCase(),
          totalSolved: stat.totalSolved,
          dailyScore: 0,
          weeklyScore: 0,
          monthlyScore: 0,
          overallScore: stat.totalSolved,
          difficulty: {
            easy: stat.easy || 0,
            medium: stat.medium || 0,
            hard: stat.hard || 0
          },
          rank: index + 1,
          lastUpdated: stat.lastUpdated,
          lastActive: stat.lastUpdated ? 
            new Date(stat.lastUpdated).toLocaleDateString() : 'Never',
          streak: Math.floor(Math.random() * 30) + 1 // Mock streak data
        }));
        setStudents(transformedData);
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError('Failed to fetch total stats');
      console.error('Error fetching total stats:', err);
    }
  };

  // Add new user
  const addUser = async () => {
    if (!newUser.username.trim()) return;
    
    setAddingUser(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewUser({ username: '', name: '' });
        setShowAddForm(false);
        // Refresh data after adding user
        await loadData();
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError('Failed to add user - Check if backend is running');
      console.error('Error adding user:', err);
    } finally {
      setAddingUser(false);
    }
  };

  // Refresh total stats
  const refreshTotalStats = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/refresh-total`);
      const data = await response.json();
      
      if (response.ok) {
        await loadData(); // Reload data after refresh
      } else {
        setError('Failed to refresh stats');
      }
    } catch (err) {
      setError('Failed to refresh stats - Check if backend is running');
      console.error('Error refreshing stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Track daily progress
  const trackDailyProgress = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/track`);
      const data = await response.json();
      
      if (response.ok) {
        await loadData(); // Reload data after tracking
      } else {
        setError('Failed to track daily progress');
      }
    } catch (err) {
      setError('Failed to track daily progress - Check if backend is running');
      console.error('Error tracking progress:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data based on sort type
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (sortType === 'total') {
        await fetchTotalStats();
      } else {
        await fetchRankings(sortType);
      }
    } catch (err) {
      setError('Failed to load data - Check if backend is running');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Reload when sort type changes
  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [sortType]);

  const sortOptions = [
    { id: 'today', label: 'Today (1 Day)', icon: Clock, key: 'dailyScore', apiType: 'today' },
    { id: 'this_week', label: 'This Week (7 Days)', icon: Calendar, key: 'weeklyScore', apiType: 'this_week' },
    { id: 'this_month', label: 'This Month (30 Days)', icon: Target, key: 'monthlyScore', apiType: 'this_month' },
    { id: 'total', label: 'Total Questions Solved', icon: Award, key: 'totalSolved', apiType: 'total' }
  ];

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort by the current metric (already sorted from API, but filter might change order)
    const currentSort = sortOptions.find(option => option.id === sortType);
    if (currentSort) {
      filtered.sort((a, b) => {
        const aValue = sortType === 'total' ? a.totalSolved : a[currentSort.key];
        const bValue = sortType === 'total' ? b.totalSolved : b[currentSort.key];
        return bValue - aValue; // Higher score is better
      });
    }

    return filtered;
  }, [students, sortType, searchTerm]);

  const handleSortChange = (newSortType) => {
    setSortType(newSortType);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    return "bg-gradient-to-r from-blue-500 to-blue-700 text-white";
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCurrentSortLabel = () => {
    return sortOptions.find(option => option.id === sortType)?.label || 'Overall';
  };

  const getCurrentScore = (student) => {
    const currentSort = sortOptions.find(option => option.id === sortType);
    if (currentSort) {
      const score = sortType === 'total' ? student.totalSolved : student[currentSort.key];
      return score.toLocaleString();
    }
    return student.totalSolved.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">LeetCode Rankings</h1>
                <p className="text-gray-600 mt-1">Student Performance Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Students</div>
                <div className="text-2xl font-bold text-gray-900">{students.length}</div>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="mb-8 space-y-4">
          {/* Add User Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Add New User</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="LeetCode Username"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Display Name (optional)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
                <button
                  onClick={addUser}
                  disabled={addingUser || !newUser.username.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {addingUser ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={trackDailyProgress}
              disabled={refreshing}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Track Daily</span>
                </>
              )}
            </button>
            <button
              onClick={refreshTotalStats}
              disabled={refreshing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Total</span>
                </>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSortChange(option.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    sortType === option.id
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Sort Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Ranking by: {getCurrentSortLabel()}
            </span>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Solved</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Difficulty Split</th>
                  {sortType === 'total' && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedStudents.length > 0 ? (
                  filteredAndSortedStudents.map((student, index) => (
                    <tr key={student.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getRankBadge(index + 1)}`}>
                          {getRankIcon(index + 1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {student.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">@{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">{getCurrentScore(student)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.totalSolved}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor('easy')}`}>
                            E: {student.difficulty.easy}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor('medium')}`}>
                            M: {student.difficulty.medium}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor('hard')}`}>
                            H: {student.difficulty.hard}
                          </span>
                        </div>
                      </td>
                      {sortType === 'total' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.lastUpdated ? new Date(student.lastUpdated).toLocaleDateString() : 'Never'}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No students found. Add some users to see rankings!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        {students.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Performer</p>
                  <p className="text-2xl font-bold text-green-600">{filteredAndSortedStudents[0]?.name || 'N/A'}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {students.length > 0 ? 
                      Math.round(students.reduce((sum, student) => sum + student.totalSolved, 0) / students.length).toLocaleString() : 
                      '0'
                    }
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {students.reduce((sum, student) => sum + student.totalSolved, 0).toLocaleString()}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-orange-600">{students.length}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRankingDashboard;