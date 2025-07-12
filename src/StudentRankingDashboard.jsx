import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Medal, Award, Calendar, Clock, Target, TrendingUp, User, Star,
  RefreshCw, Plus, Loader2, BarChart2, Hash // Added Hash for generic rank icon if needed
} from 'lucide-react';

const StudentRankingDashboard = () => {
  const [students, setStudents] = useState([]); // This will hold the currently displayed students
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingProblemSolving, setRefreshingProblemSolving] = useState(false);
  const [refreshingContest, setRefreshingContest] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', name: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Single state to manage the active ranking type
  // Default to 'total' problem solving
  const [activeRankingType, setActiveRankingType] = useState('today');

  const [searchTerm, setSearchTerm] = useState('');

  // API Base URL
  const API_BASE = 'https://ducs-leetcode-tracker-1.onrender.com';

  // --- Data Fetching Functions ---

  /**
   * Fetches rankings based on the specified type ('today', 'this_week', 'this_month', 'total', 'contest').
   */
  const fetchRankings = async (type) => {
    try {
      let endpoint;
      if (type === 'contest') {
        endpoint = '/contest-rankings';
      } else if (type === 'total') {
        endpoint = '/total-leaderboard';
      } else { // 'today', 'this_week', 'this_month'
        endpoint = `/ranking?type=${type}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Fetched ${type} rankings:`, data);

      let transformedData = [];

      if (type === 'contest') {
        const rawRankings = Array.isArray(data) ? data : [];
        transformedData = rawRankings
          .filter(rank => {
            return rank && rank.user && rank.user.username && typeof rank.rating === 'number' && !isNaN(rank.rating);
          })
          .map(rank => ({
            id: rank.user._id || rank.id || `user-${rank.user.username}`,
            name: rank.user.username,
            username: rank.user.username,
            avatar: rank.user.username.substring(0, 2).toUpperCase(),
            contestRating: rank.rating,
            globalRanking: rank.globalRanking || 'N/A',
            attendedContestsCount: rank.attendedContestsCount || 0,
            topPercentage: typeof rank.topPercentage === 'number' ? rank.topPercentage : null,
            lastActive: rank.updatedAt ? new Date(rank.updatedAt).toLocaleDateString() : 'N/A',
            badge: rank.badge ? rank.badge.name : null,
            totalParticipants: rank.totalParticipants || 0
          }));

        if (transformedData.length === 0 && rawRankings.length > 0) {
          console.warn("⚠️ API returned contest data, but no valid entries were found after filtering.");
          setError("No valid contest data entries found in the response.");
        } else if (rawRankings.length === 0) {
          console.warn("⚠️ API returned an empty array for contest rankings.");
          setError("No contest data available from API.");
        }

      } else { // Problem Solving: 'today', 'this_week', 'this_month', 'total'
        if (type === 'total' && data.stats) {
          transformedData = data.stats.map(stat => ({
            id: stat.user,
            name: stat.username,
            username: stat.username,
            avatar: stat.username.substring(0, 2).toUpperCase(),
            totalSolved: stat.totalSolved,
            dailyScore: 0, // Not relevant for total view direct fetch
            weeklyScore: 0, // Not relevant for total view direct fetch
            monthlyScore: 0, // Not relevant for total view direct fetch
            overallScore: stat.totalSolved,
            difficulty: { easy: stat.easy || 0, medium: stat.medium || 0, hard: stat.hard || 0 },
            lastUpdated: stat.lastUpdated,
            lastActive: stat.lastUpdated ? new Date(stat.lastUpdated).toLocaleDateString() : 'Never',
            streak: Math.floor(Math.random() * 30) + 1 // Mock streak data
          }));
        } else if (data.results) { // For daily, weekly, monthly
          transformedData = data.results.map(result => ({
            id: result._id,
            name: result.username,
            username: result.username,
            avatar: result.username.substring(0, 2).toUpperCase(),
            totalSolved: result.totalCount, // This totalCount is for the period
            dailyScore: type === 'today' ? result.totalCount : 0,
            weeklyScore: type === 'this_week' ? result.totalCount : 0,
            monthlyScore: type === 'this_month' ? result.totalCount : 0,
            overallScore: result.totalCount, // Score for the selected period
            difficulty: { easy: result.easy || 0, medium: result.medium || 0, hard: result.hard || 0 },
            lastActive: 'Recently', // Backend might not provide this per period
            streak: Math.floor(Math.random() * 30) + 1 // Mock streak data
          }));
        }
      }
      setStudents(transformedData);

    } catch (err) {
      setError(`Failed to fetch ${type} rankings: ${err.message}`);
      console.error(`Error fetching ${type} rankings:`, err);
      setStudents([]);
    }
  };

  /**
   * Main data loading function based on current activeRankingType.
   */
  const loadData = async () => {
    setLoading(true);
    setError(null);
    setStudents([]); // Clear current data while loading
    await fetchRankings(activeRankingType);
    setLoading(false);
  };

  // --- Refresh & Add User Actions ---

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
        await fetchRankings(activeRankingType); // Refresh currently active data
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError('Failed to add user - Check if backend is running or username is valid');
      console.error('Error adding user:', err);
    } finally {
      setAddingUser(false);
    }
  };

  const refreshProblemSolvingStats = async () => {
    setRefreshingProblemSolving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/refresh-total`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      // After refreshing total, re-fetch the currently active problem-solving view
      await fetchRankings(activeRankingType);
    } catch (err) {
      setError(`Failed to refresh problem-solving stats: ${err.message}`);
      console.error('Error refreshing problem-solving stats:', err);
    } finally {
      setRefreshingProblemSolving(false);
    }
  };

  const trackDailyProgress = async () => {
    setRefreshingProblemSolving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/track`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      // After tracking daily, refresh the 'today' view
      await fetchRankings('today');
      // If the current active view is not 'today', switch to 'today' after tracking
      if (activeRankingType !== 'today') {
        setActiveRankingType('today');
      }
    } catch (err) {
      setError(`Failed to track daily progress: ${err.message}`);
      console.error('Error tracking progress:', err);
    } finally {
      setRefreshingProblemSolving(false);
    }
  };

  const refreshContestData = async () => {
    setRefreshingContest(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/refresh-contests`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      await fetchRankings('contest');
    } catch (err) {
      setError(`Failed to refresh contest data: ${err.message}`);
      console.error('Error refreshing contest data:', err);
    } finally {
      setRefreshingContest(false);
    }
  };

  // --- useEffects for Data Loading ---

  // Initial load when component mounts or activeRankingType changes
  useEffect(() => {
    loadData();
  }, [activeRankingType]);

  // --- Memoized Data for Display ---

  const rankingOptions = [
    { id: 'contest', label: 'Contest Rankings', icon: BarChart2, primarySortKey: 'contestRating', isContest: true },
    { id: 'today', label: 'Today', icon: Clock, primarySortKey: 'dailyScore' },
    { id: 'this_week', label: 'This Week', icon: Calendar, primarySortKey: 'weeklyScore' },
    { id: 'this_month', label: 'This Month', icon: Target, primarySortKey: 'monthlyScore' },
    { id: 'total', label: 'Total Questions', icon: Award, primarySortKey: 'totalSolved' }
  ];

  const currentRankingOption = useMemo(() =>
    rankingOptions.find(option => option.id === activeRankingType),
    [activeRankingType]
  );


  const filteredAndRankedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];

    let filtered = students.filter(student =>
      student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort based on the current active ranking type's primary sort key
    if (currentRankingOption) {
      filtered.sort((a, b) => {
        const aValue = a[currentRankingOption.primarySortKey] || 0;
        const bValue = b[currentRankingOption.primarySortKey] || 0;
        return bValue - aValue; // Higher score/rating is better
      });
    }

    // Assign rank after sorting
    return filtered.map((student, index) => ({ ...student, rank: index + 1 }));
  }, [students, searchTerm, activeRankingType, currentRankingOption]);

  // --- UI Helper Functions ---

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

  const getBadgeDisplay = (badge) => {
    if (!badge) return null;
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <Star className="w-3 h-3 mr-1" />
        {badge}
      </span>
    );
  };

  // --- Conditional UI Rendering ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
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
                <p className="text-gray-600 mt-1">DUCS Student Performance Dashboard</p>
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

          {/* Action Buttons (Refresh buttons) */}
          <div className="flex flex-wrap gap-2">
            {currentRankingOption?.isContest ? (
               <button
                onClick={refreshContestData}
                disabled={refreshingContest}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {refreshingContest ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{refreshingContest ? 'Refreshing...' : 'Refresh Contest Data'}</span>
              </button>
            ) : ( // For problem solving views
              <>
                <button
                  onClick={trackDailyProgress}
                  disabled={refreshingProblemSolving}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {refreshingProblemSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  <span>{refreshingProblemSolving ? 'Updating Daily...' : 'Track Daily'}</span>
                </button>
                <button
                  onClick={refreshProblemSolvingStats}
                  disabled={refreshingProblemSolving}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {refreshingProblemSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{refreshingProblemSolving ? 'Refreshing Total...' : 'Refresh Total'}</span>
                </button>
              </>
            )}
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

          {/* Sort Options (5 buttons) */}
          <div className="flex flex-wrap gap-2">
            {rankingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setActiveRankingType(option.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeRankingType === option.id
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

        {/* Current Sort Info (Optional, but good for clarity) */}
        {currentRankingOption && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Ranking by: {currentRankingOption.label}
              </span>
            </div>
          </div>
        )}


        {/* Rankings Table */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                  {!currentRankingOption?.isContest ? ( // Problem Solving Headers
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {currentRankingOption?.label || 'Score'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Solved</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Difficulty Split</th>
                      {activeRankingType === 'total' && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                      )}
                    </>
                  ) : ( // Contest Headers
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contest Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Global Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contests Attended</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Top %</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndRankedStudents.length > 0 ? (
                  filteredAndRankedStudents.map((student) => (
                    <tr key={student.id} className={`hover:bg-gray-50 transition-colors duration-200 ${student.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getRankBadge(student.rank)}`}>
                          {student.rank <= 3 ? getRankIcon(student.rank) : (
                            <span className="text-sm font-bold">#{student.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {student.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.username}
                            </div>
                            {currentRankingOption?.isContest && student.badge && (
                              <div className="mt-1">
                                {getBadgeDisplay(student.badge)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {!currentRankingOption?.isContest ? ( // Problem Solving Data
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-blue-600">
                              {student[currentRankingOption?.primarySortKey || 'totalSolved']?.toLocaleString() || '0'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{student.totalSolved?.toLocaleString() || '0'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor('easy')}`}>
                                E: {student.difficulty?.easy || '0'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor('medium')}`}>
                                M: {student.difficulty?.medium || '0'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor('hard')}`}>
                                H: {student.difficulty?.hard || '0'}
                              </span>
                            </div>
                          </td>
                          {activeRankingType === 'total' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.lastUpdated ? new Date(student.lastUpdated).toLocaleDateString() : 'Never'}
                            </td>
                          )}
                        </>
                      ) : ( // Contest Data
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-purple-600">
                              {typeof student.contestRating === 'number' ? student.contestRating.toFixed(2) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {typeof student.globalRanking === 'number' ? student.globalRanking.toLocaleString() : student.globalRanking}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {student.attendedContestsCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {typeof student.topPercentage === 'number' ? `${student.topPercentage.toFixed(2)}%` : 'N/A'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={currentRankingOption?.isContest ? 6 : (activeRankingType === 'total' ? 6 : 5)} className="px-6 py-8 text-center text-gray-500">
                      <div className="py-8">
                        {currentRankingOption?.icon && React.createElement(currentRankingOption.icon, { className: "w-12 h-12 text-gray-300 mx-auto mb-4" })}
                        <p className="text-lg font-medium text-gray-900 mb-2">No data found</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'Try adjusting your search term.' : 'Data will appear here once available.'}
                        </p>
                        {!currentRankingOption?.isContest ? (
                          <p className="text-sm text-gray-500 mt-2">
                            Consider using "Add User" or "Track Daily / Refresh Problem Stats" to populate data.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">
                            Consider using "Add User" or "Refresh Contest Data" to populate data.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary (Conditional) */}
        {filteredAndRankedStudents.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Performer</p>
                  <p className="text-2xl font-bold text-green-600">{filteredAndRankedStudents[0]?.username || 'N/A'}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            {!currentRankingOption?.isContest ? ( // Problem Solving Stats
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average {currentRankingOption?.label || 'Score'}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {filteredAndRankedStudents.length > 0 ?
                          Math.round(filteredAndRankedStudents.reduce((sum, student) => sum + (student[currentRankingOption?.primarySortKey] || 0), 0) / filteredAndRankedStudents.length).toLocaleString() :
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
                      <p className="text-sm text-gray-600">Total Problems Solved</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {filteredAndRankedStudents.reduce((sum, student) => sum + (student.totalSolved || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </>
            ) : ( // Contest Stats
              <>
                 <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Contest Rating</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {filteredAndRankedStudents.length > 0 ?
                          Math.round(filteredAndRankedStudents.reduce((sum, student) => sum + (student.contestRating || 0), 0) / filteredAndRankedStudents.length).toLocaleString() :
                          '0'
                        }
                      </p>
                    </div>
                    <BarChart2 className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                 <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Contests Attended</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {filteredAndRankedStudents.reduce((sum, student) => sum + (student.attendedContestsCount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Users Displayed</p>
                  <p className="text-2xl font-bold text-orange-600">{filteredAndRankedStudents.length}</p>
                </div>
                <User className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRankingDashboard;