"use client";

import { useState, useEffect, useMemo } from "react";

export default function Home() {
  // App state
  const [pushups, setPushups] = useState(Array(30).fill(0));
  const [currentDay, setCurrentDay] = useState(1);
  const [progress, setProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [canUpdate, setCanUpdate] = useState(true);
  const [activeTab, setActiveTab] = useState('challenge');
  const [showConfetti, setShowConfetti] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [userLevel, setUserLevel] = useState(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [updateValue, setUpdateValue] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);

  // Define push-up levels
  const levels = [
    { level: 1, name: "Beginner", requirement: 0, daily: 10, color: "text-gray-400" },
    { level: 2, name: "Rookie", requirement: 100, daily: 25, color: "text-blue-400" },
    { level: 3, name: "Intermediate", requirement: 300, daily: 50, color: "text-green-400" },
    { level: 4, name: "Advanced", requirement: 600, daily: 75, color: "text-purple-400" },
    { level: 5, name: "Expert", requirement: 1000, daily: 100, color: "text-amber-400" },
    { level: 6, name: "Master", requirement: 1500, daily: 150, color: "text-red-400" },
    { level: 7, name: "Elite", requirement: 2000, daily: 200, color: "text-fuchsia-400" },
  ];

  // Load data on first render
  useEffect(() => {
    try {
      // Load push-up data
      const savedData = localStorage.getItem("pushupData");
      if (savedData) {
        setPushups(JSON.parse(savedData));
      }
      
      // Load user level
      const savedLevel = localStorage.getItem("userLevel");
      if (savedLevel) {
        setUserLevel(parseInt(savedLevel) || 1);
      }
      
      // Load last update time but don't restrict updates
      const lastUpdateTime = localStorage.getItem("lastUpdateTime");
      if (lastUpdateTime) {
        setLastUpdate(lastUpdateTime);
      }
      
      // Set current day and handle start/end dates
      calculateCurrentDay();
      
      // Check if challenge is completed
      checkChallengeCompletion();
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  // Calculate current day of challenge
  const calculateCurrentDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const storedStartDate = localStorage.getItem("challengeStartDate");
    
    if (storedStartDate) {
      const startDate = new Date(storedStartDate);
      startDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Calculate days since challenge start
      const diffTime = today - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is the start date
      
      if (diffDays > 0) {
        // Check if there are any completed days
        const completedDays = pushups.filter(count => count > 0).length;
        
        if (completedDays === 0) {
          // No pushups recorded yet, stay on day 1
          setCurrentDay(1);
        } else if (completedDays < 30) {
          // Find the next incomplete day
          let nextIncompleteDay = 1;
          while (nextIncompleteDay <= 30 && pushups[nextIncompleteDay - 1] > 0) {
            nextIncompleteDay++;
          }
          
          // If within 30-day window, use the max of calendar day and next incomplete day
          if (diffDays <= 30) {
            setCurrentDay(Math.min(Math.max(diffDays, nextIncompleteDay), 30));
          } else {
            // Past 30 days but challenge not complete, go to next incomplete day
            setCurrentDay(nextIncompleteDay <= 30 ? nextIncompleteDay : completedDays + 1);
          }
        } else {
          // All 30 days completed
          setCurrentDay(30);
        }
      } else {
        // Challenge start date is in the future (shouldn't normally happen)
        setCurrentDay(1);
      }
    } else {
      // First time using app - set today as the start date
      localStorage.setItem("challengeStartDate", today.toISOString());
      setCurrentDay(1);
    }
  };

  // Update progress and level calculation when pushups change
  useEffect(() => {
    // Calculate overall progress (as percentage of target based on level)
    const totalPushups = pushups.reduce((sum, count) => sum + count, 0);
    const currentLevelData = getCurrentLevelData();
    const totalGoal = 30 * currentLevelData.daily; // 30 days x daily target
    const calculatedProgress = Math.min(Math.round((totalPushups / totalGoal) * 100), 100);
    setProgress(calculatedProgress);
    
    // Update user level based on total pushups
    const newLevel = determineUserLevel(totalPushups);
    if (newLevel !== userLevel) {
      setUserLevel(newLevel);
      localStorage.setItem("userLevel", newLevel.toString());
      
      // Show confetti for level up
      if (newLevel > userLevel) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
    
    // Save push-up data
    localStorage.setItem("pushupData", JSON.stringify(pushups));
    
    // Check if challenge is completed
    checkChallengeCompletion();
  }, [pushups, userLevel]);

  // Determine user level based on total pushups
  const determineUserLevel = (totalPushups) => {
    let newLevel = 1;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPushups >= levels[i].requirement) {
        newLevel = levels[i].level;
        break;
      }
    }
    return newLevel;
  };

  // Get current level data
  const getCurrentLevelData = () => {
    return levels.find(level => level.level === userLevel) || levels[0];
  };

  // Analytics calculations
  const stats = useMemo(() => {
    const totalPushups = pushups.reduce((sum, count) => sum + count, 0);
    const completedDays = pushups.filter(count => count > 0).length;
    const currentLevelData = getCurrentLevelData();
    const dailyTarget = currentLevelData.daily;
    const perfectDays = pushups.filter(count => count >= dailyTarget).length;
    const avgPerDay = completedDays > 0 ? Math.round(totalPushups / completedDays) : 0;
    const bestDay = Math.max(...pushups);
    
    // Next level data
    const nextLevelData = levels.find(level => level.level === userLevel + 1);
    const pushupsTillNextLevel = nextLevelData 
      ? Math.max(0, nextLevelData.requirement - totalPushups)
      : 0;
    
    // Calculate remaining to reach daily target
    const remainingToday = currentDay > 0 && currentDay <= 30 
      ? Math.max(0, dailyTarget - pushups[currentDay - 1])
      : 0;
    
    // Calculate streak (consecutive days with at least 1 push-up)
    let currentStreak = 0;
    for (let i = 0; i < currentDay; i++) {
      if (pushups[i] > 0) currentStreak++;
      else break;
    }
    
    // Calculate perfect streak (consecutive days meeting the target)
    let perfectStreak = 0;
    for (let i = 0; i < currentDay; i++) {
      if (pushups[i] >= dailyTarget) perfectStreak++;
      else break;
    }
    
    return {
      totalPushups,
      completedDays,
      perfectDays,
      avgPerDay,
      bestDay,
      remainingToday,
      currentStreak,
      perfectStreak,
      dailyTarget,
      pushupsTillNextLevel,
      hasNextLevel: !!nextLevelData
    };
  }, [pushups, currentDay, userLevel]);

  // Create calendar matrix (5 weeks x 6 days)
  const calendarMatrix = useMemo(() => {
    const matrix = [];
    for (let week = 0; week < 5; week++) {
      const weekRow = [];
      for (let day = 0; day < 6; day++) {
        const dayIndex = week * 6 + day;
        if (dayIndex < 30) {
          weekRow.push(dayIndex);
        }
      }
      matrix.push(weekRow);
    }
    return matrix;
  }, []);
  
  // Get day label (Mon, Tue, etc.)
  const getDayLabel = (dayIndex) => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels[dayIndex % 6];
  };

  // Get color based on completion percentage relative to current level target
  const getCompletionColor = (count) => {
    const dailyTarget = getCurrentLevelData().daily;
    const percentage = Math.min(count / dailyTarget, 1);
    
    if (percentage === 0) return "bg-neutral-900 border-neutral-800 text-neutral-400";
    if (percentage < 0.25) return "bg-red-950 border-red-900 text-red-400";
    if (percentage < 0.5) return "bg-orange-950 border-orange-900 text-orange-400";
    if (percentage < 0.75) return "bg-yellow-950 border-yellow-900 text-yellow-400";
    if (percentage < 1) return "bg-blue-950 border-blue-900 text-blue-400";
    return "bg-green-950 border-green-900 text-green-400";
  };
  
  // Get text based on completion percentage
  const getCompletionText = (count) => {
    const dailyTarget = getCurrentLevelData().daily;
    const percentage = Math.min(count / dailyTarget, 1);
    
    if (percentage === 0) return "Not started";
    if (percentage === 1) return "Complete!";
    return `${Math.round(percentage * 100)}% complete`;
  };

  // Submit new push-ups without time restriction
  const submitPushups = () => {
    // Validate input
    const count = parseInt(inputValue);
    if (isNaN(count) || count < 0) {
      alert("Please enter a valid number");
      return;
    }
    
    // Update state
    const newPushups = [...pushups];
    const dayIndex = currentDay - 1;
    
    if (dayIndex >= 0 && dayIndex < 30) {
      newPushups[dayIndex] = count;
      setPushups(newPushups);
      
      const dailyTarget = getCurrentLevelData().daily;
      
      // Show confetti if daily target met
      if (count >= dailyTarget) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      // Record update time without restricting updates
      const now = new Date().getTime();
      localStorage.setItem("lastUpdateTime", now.toString());
      setLastUpdate(now.toString());
      setCanUpdate(true); // Always allow updates
      
      // Clear input
      setInputValue('');
    }
  };
  
  // Update getTimeToNextUpdate to show last update time instead of countdown
  const getTimeToNextUpdate = () => {
    if (!lastUpdate) return "No updates yet";
    
    // Format the last update time as a readable date
    const updateDate = new Date(parseInt(lastUpdate));
    return `Last updated: ${updateDate.toLocaleDateString()} at ${updateDate.toLocaleTimeString()}`;
  };

  // Reset challenge
  const resetChallenge = () => {
    if (confirm("Are you sure you want to reset your 30-day challenge? All progress will be lost.")) {
      localStorage.setItem("challengeStartDate", new Date().toISOString());
      localStorage.removeItem("lastUpdateTime");
      setPushups(Array(30).fill(0));
      setCurrentDay(1);
      setLastUpdate(null);
      setInputValue('');
      setUserLevel(1);
      localStorage.setItem("userLevel", "1");
    }
  };

  // Add function to handle day click
  const handleDayClick = (dayIndex) => {
    setSelectedDay(dayIndex);
    setUpdateValue(pushups[dayIndex].toString());
    setShowUpdateModal(true);
  };

  // Add function to handle update
  const handleUpdate = () => {
    const count = parseInt(updateValue);
    if (isNaN(count) || count < 0) {
      alert("Please enter a valid number");
      return;
    }
    
    const newPushups = [...pushups];
    newPushups[selectedDay] = count;
    setPushups(newPushups);
    
    const dailyTarget = getCurrentLevelData().daily;
    
    // Show confetti if daily target met
    if (count >= dailyTarget) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    // Record update time
    const now = new Date().getTime();
    localStorage.setItem("lastUpdateTime", now.toString());
    setLastUpdate(now.toString());
    
    // Close modal and reset
    setShowUpdateModal(false);
    setUpdateValue('');
    setSelectedDay(null);
  };

  // Add function to check if challenge is completed
  const checkChallengeCompletion = () => {
    const completedDays = pushups.filter(count => count > 0).length;
    const totalPushups = pushups.reduce((sum, count) => sum + count, 0);
    const currentLevelData = getCurrentLevelData();
    const perfectDays = pushups.filter(count => count >= currentLevelData.daily).length;
    
    if (completedDays === 30) {
      setShowCompletion(true);
    }
  };

  // Add completion page component
  const renderCompletionPage = () => {
    const totalPushups = pushups.reduce((sum, count) => sum + count, 0);
    const currentLevelData = getCurrentLevelData();
    const perfectDays = pushups.filter(count => count >= currentLevelData.daily).length;
    const avgPerDay = Math.round(totalPushups / 30);
    const bestDay = Math.max(...pushups);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-neutral-950 p-4 sm:p-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-8 mb-8 border border-neutral-800">
            <h1 className="text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-fuchsia-400">
              Challenge Completed! 🎉
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-neutral-800/50 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Final Stats</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Total Push-ups</span>
                    <span className="font-bold text-xl text-neutral-200">{totalPushups}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Average Per Day</span>
                    <span className="font-bold text-xl text-neutral-200">{avgPerDay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Best Day</span>
                    <span className="font-bold text-xl text-neutral-200">{bestDay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Perfect Days</span>
                    <span className="font-bold text-xl text-neutral-200">{perfectDays}/30</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-800/50 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Achievements</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white">1</span>
                    </div>
                    <span className="text-neutral-300">Completed 30-Day Challenge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white">2</span>
                    </div>
                    <span className="text-neutral-300">Reached Level {userLevel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white">3</span>
                    </div>
                    <span className="text-neutral-300">{perfectDays} Perfect Days</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={resetChallenge}
                className="px-6 py-3 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                Start New Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDER FUNCTIONS
  const renderCalendarView = () => {
    const dailyTarget = getCurrentLevelData().daily;
    
    return (
      <div>
        <div className="grid gap-4 mb-6">
          {calendarMatrix.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-4 justify-center">
              {week.map((dayIndex) => {
                const count = pushups[dayIndex];
                const isToday = dayIndex === currentDay - 1;
                const percentage = Math.min(Math.round((count / dailyTarget) * 100), 100);
                
                return (
                  <div 
                    key={dayIndex} 
                    onClick={() => handleDayClick(dayIndex)}
                    className={`
                      border rounded-2xl p-3 sm:p-4 w-[70px] sm:w-[80px]
                      backdrop-blur-sm shadow-md transition-all duration-300 
                      hover:scale-105 hover:shadow-lg cursor-pointer
                      ${getCompletionColor(count)}
                      ${isToday ? 'ring-2 ring-purple-400 shadow-lg' : ''}
                    `}
                  >
                    <div className="flex flex-col">
                      <p className="text-center text-xs text-neutral-500 mb-1">{getDayLabel(dayIndex)}</p>
                      <p className="text-center font-bold mb-2 text-neutral-300">Day {dayIndex + 1}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-neutral-800 rounded-full h-2 mb-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-center">{count}/{dailyTarget}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Update Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-2xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold mb-4 text-center text-neutral-200">
                Update Day {selectedDay + 1}
              </h3>
              <div className="flex flex-col gap-4">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder="Enter push-up count"
                  className="bg-neutral-800 text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-500"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setShowUpdateModal(false);
                      setUpdateValue('');
                      setSelectedDay(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center gap-6 mt-8 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-900 border-neutral-800 rounded"></div>
            <span className="text-xs text-neutral-400">0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-950 border-red-900 rounded"></div>
            <span className="text-xs text-neutral-400">1-24%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-950 border-orange-900 rounded"></div>
            <span className="text-xs text-neutral-400">25-49%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-950 border-yellow-900 rounded"></div>
            <span className="text-xs text-neutral-400">50-74%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-950 border-blue-900 rounded"></div>
            <span className="text-xs text-neutral-400">75-99%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-950 border-green-900 rounded"></div>
            <span className="text-xs text-neutral-400">100%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTodayView = () => {
    const todaysCount = currentDay > 0 && currentDay <= 30 ? pushups[currentDay - 1] : 0;
    const currentLevelData = getCurrentLevelData();
    const percentage = Math.min(Math.round((todaysCount / currentLevelData.daily) * 100), 100);
    
    // Calculate challenge dates for display
    const startDateStr = localStorage.getItem("challengeStartDate");
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 29); // 30 days total (0-29)
    
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Day {currentDay} of 30
        </h2>
        
        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-6 border border-neutral-800">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="text-sm text-neutral-400">
              Challenge Period: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </div>
            <div className="text-sm text-neutral-400">
              {getTimeToNextUpdate()}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`text-2xl font-bold ${currentLevelData.color}`}>
              Level {userLevel}: {currentLevelData.name}
            </div>
          </div>
          <div className="text-sm text-neutral-400 text-center mb-2">
            Daily Target: {currentLevelData.daily} push-ups
          </div>
          
          {stats.hasNextLevel && (
            <div className="text-sm text-neutral-400 text-center">
              {stats.pushupsTillNextLevel} more push-ups until Level {userLevel + 1}
            </div>
          )}
        </div>
        
        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 mb-8 border border-neutral-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg text-neutral-300">Today&apos;s Progress</span>
            <span className="text-lg font-bold text-neutral-200">{todaysCount}/{currentLevelData.daily}</span>
          </div>
          
          <div className="w-full bg-neutral-800 rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ease-out ${currentLevelData.color.replace('text-', 'bg-')}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-neutral-400 text-center mt-2">
            {percentage < 100 ? `${currentLevelData.daily - todaysCount} push-ups remaining today` : "Goal complete! 🎉"}
          </div>
        </div>
        
        <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 border border-neutral-800">
          <h3 className="text-lg font-medium mb-4 text-neutral-300 text-center">Log Your Push-ups</h3>
          
          <div className="flex gap-3 mb-4">
            <input
              type="number"
              min="0"
              max="999"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="How many push-ups?"
              className="flex-1 bg-neutral-800 text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={submitPushups}
              className="px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-500"
            >
              Submit
            </button>
          </div>
          
          <div className="text-sm text-neutral-400 text-center">
            You can update your push-up count anytime
          </div>
        </div>
      </div>
    );
  };

  const renderStatsView = () => {
    const currentLevelData = getCurrentLevelData();
    
    return (
      <div>
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-neutral-800 mb-6">
          <h3 className="font-medium mb-4 text-neutral-300 text-center">Push-up Levels</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-neutral-300">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="py-2 px-2 text-left">Level</th>
                  <th className="py-2 px-2 text-left">Name</th>
                  <th className="py-2 px-2 text-left">Required</th>
                  <th className="py-2 px-2 text-left">Daily Target</th>
                </tr>
              </thead>
              <tbody>
                {levels.map(level => (
                  <tr 
                    key={level.level} 
                    className={`
                      border-b border-neutral-800 
                      ${level.level === userLevel ? 'bg-neutral-800/30' : ''}
                    `}
                  >
                    <td className="py-2 px-2">{level.level}</td>
                    <td className={`py-2 px-2 ${level.color}`}>{level.name}</td>
                    <td className="py-2 px-2">{level.requirement}+ pushups</td>
                    <td className="py-2 px-2">{level.daily} per day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-neutral-800">
            <h3 className="font-medium mb-4 text-neutral-300">Challenge Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Total Push-ups</span>
                <span className="font-bold text-xl text-neutral-200">{stats.totalPushups}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Avg. Per Day</span>
                <span className="font-bold text-xl text-neutral-200">{stats.avgPerDay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Best Day</span>
                <span className="font-bold text-xl text-neutral-200">{stats.bestDay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Current Streak</span>
                <span className="font-bold text-xl text-neutral-200">{stats.currentStreak} days</span>
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-neutral-800">
            <h3 className="font-medium mb-4 text-neutral-300">Goal Progress</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400 text-sm">Overall Completion</span>
                <span className="text-neutral-400 text-sm">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ease-out ${currentLevelData.color.replace('text-', 'bg-')}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Days Completed</span>
                <span className="font-bold text-neutral-200">{stats.completedDays}/30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Perfect Days</span>
                <span className="font-bold text-neutral-200">{stats.perfectDays}/30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Perfect Streak</span>
                <span className="font-bold text-neutral-200">{stats.perfectStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // MAIN RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-neutral-950 p-4 sm:p-8 pb-20 font-[family-name:var(--font-geist-sans)] text-neutral-200">
      {showCompletion ? (
        renderCompletionPage()
      ) : (
        <>
          {/* Confetti effect */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} 
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                ></div>
              ))}
            </div>
          )}
          
          {/* Header */}
          <main className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-6 bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-neutral-800">
              <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-fuchsia-400 text-center">
                30-Day Push-up Challenge
              </h1>
              <p className="text-neutral-400 text-sm mb-4 text-center">Level-based progressive training</p>
              
              {/* Level display */}
              <div className={`text-xl font-bold ${getCurrentLevelData().color} mb-4`}>
                Level {userLevel}: {getCurrentLevelData().name}
              </div>
              
              {/* Stats summary */}
              <div className="flex gap-4 mt-2 flex-wrap justify-center">
                <div className="text-center p-4 bg-purple-950 rounded-xl border border-purple-900 w-[100px]">
                  <p className="text-3xl font-bold text-purple-400">{stats.completedDays}</p>
                  <p className="text-xs text-neutral-400">Days Done</p>
                </div>
                <div className="text-center p-4 bg-fuchsia-950 rounded-xl border border-fuchsia-900 w-[100px]">
                  <p className="text-3xl font-bold text-fuchsia-400">{stats.totalPushups}</p>
                  <p className="text-xs text-neutral-400">Total Done</p>
                </div>
                <div className="text-center p-4 bg-blue-950 rounded-xl border border-blue-900 w-[100px]">
                  <p className="text-3xl font-bold text-blue-400">{stats.perfectDays}</p>
                  <p className="text-xs text-neutral-400">Perfect Days</p>
                </div>
                <div className="text-center p-4 bg-neutral-950 rounded-xl border border-neutral-900 w-[100px]">
                  <p className="text-3xl font-bold text-neutral-300">{currentDay}/30</p>
                  <p className="text-xs text-neutral-400">Current Day</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-6 px-4">
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-400 text-sm">Level Progress</span>
                  <span className="text-neutral-400 text-sm">{progress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getCurrentLevelData().color.replace('text-', 'bg-')}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <button 
                onClick={resetChallenge}
                className="mt-6 text-sm text-neutral-400 hover:text-red-400 transition-colors"
              >
                Reset Challenge
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-neutral-800 mb-6">
              <div className="flex border-b border-neutral-800 mb-6 overflow-x-auto pb-1">
                <button 
                  onClick={() => setActiveTab('challenge')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'challenge' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-neutral-400 hover:text-neutral-300'}`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'calendar' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-neutral-400 hover:text-neutral-300'}`}
                >
                  Calendar
                </button>
                <button 
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'stats' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-neutral-400 hover:text-neutral-300'}`}
                >
                  Statistics
                </button>
              </div>

              {/* Tab content */}
              {activeTab === 'challenge' && renderTodayView()}
              {activeTab === 'calendar' && renderCalendarView()}
              {activeTab === 'stats' && renderStatsView()}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
