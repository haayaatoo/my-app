import React, { useState, useEffect } from 'react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'other',
    date: '',
    time: '',
    endTime: '',
    description: '',
    assignee: '',
    reminder: 'none',
    isRecurring: false,
    recurringType: 'none',
    recurringEndDate: ''
  });
  const [filterType, setFilterType] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [ppInterviews, setPpInterviews] = useState([]);
  const [bpProspects, setBpProspects] = useState([]);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [allAssignees, setAllAssignees] = useState([]);

  // PP面談データ取得
  useEffect(() => {
    fetch('http://localhost:8000/api/interviews/')
      .then(res => res.json())
      .then(data => {
        setPpInterviews(data);
        // 担当者リストを更新
        const assignees = [...new Set(data.map(d => d.sales_person))];
        setAllAssignees(prev => [...new Set([...prev, ...assignees])]);
      })
      .catch(err => console.error('PP面談データ取得エラー:', err));
  }, []);

  // BP商談データ取得
  useEffect(() => {
    fetch('http://localhost:8000/api/bp-prospects/')
      .then(res => res.json())
      .then(data => {
        setBpProspects(data);
        // 担当者リストを更新
        const assignees = [...new Set(data.map(d => d.main_planner))];
        setAllAssignees(prev => [...new Set([...prev, ...assignees])]);
      })
      .catch(err => console.error('BP商談データ取得エラー:', err));
  }, []);

  // カスタムイベントデータ取得
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents);
      setEvents(parsedEvents);
      // 担当者リストを更新
      const assignees = [...new Set(parsedEvents.map(e => e.assignee).filter(Boolean))];
      setAllAssignees(prev => [...new Set([...prev, ...assignees])]);
    }
  }, []);

  // リマインダーチェック
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      events.forEach(event => {
        if (event.reminder !== 'none' && event.date && event.time) {
          const eventDate = new Date(`${event.date}T${event.time}`);
          let reminderTime;
          
          switch (event.reminder) {
            case '5min':
              reminderTime = new Date(eventDate.getTime() - 5 * 60000);
              break;
            case '15min':
              reminderTime = new Date(eventDate.getTime() - 15 * 60000);
              break;
            case '30min':
              reminderTime = new Date(eventDate.getTime() - 30 * 60000);
              break;
            case '1hour':
              reminderTime = new Date(eventDate.getTime() - 60 * 60000);
              break;
            case '1day':
              reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60000);
              break;
            default:
              return;
          }
          
          // リマインダー時刻の1分以内なら通知
          if (Math.abs(now - reminderTime) < 60000) {
            if (Notification.permission === 'granted') {
              new Notification(`予定のリマインダー: ${event.title}`, {
                body: `${event.date} ${event.time}`,
                icon: '/favicon.ico'
              });
            }
          }
        }
      });
    };

    // 通知の許可を要求
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkReminders, 60000); // 1分ごとにチェック
    return () => clearInterval(interval);
  }, [events]);

  // イベント保存
  const saveEvents = (updatedEvents) => {
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  };

  // 定期予定を展開
  const expandRecurringEvents = (event, startDate, endDate) => {
    if (!event.isRecurring || event.recurringType === 'none') {
      return [event];
    }

    const expandedEvents = [];
    const eventDate = new Date(event.date);
    const recurringEnd = event.recurringEndDate ? new Date(event.recurringEndDate) : endDate;
    
    let currentDate = new Date(eventDate);
    
    while (currentDate <= recurringEnd && currentDate <= endDate) {
      if (currentDate >= startDate) {
        expandedEvents.push({
          ...event,
          date: formatDate(currentDate),
          id: `${event.id}-${formatDate(currentDate)}`
        });
      }
      
      switch (event.recurringType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          return expandedEvents;
      }
    }
    
    return expandedEvents;
  };

  // 週の日数を取得
  const getDaysInWeek = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // 日曜日から開始
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    return days;
  };

  // 月の日数を取得
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    // 前月の日付で埋める
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDay = new Date(year, month, -firstDayOfMonth + i + 1);
      days.push({ date: prevMonthDay, isCurrentMonth: false });
    }
    
    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // 次月の日付で埋める(6週間分)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  // 日付の予定を取得
  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    const allEvents = [];

    // PP面談
    if (filterType === 'all' || filterType === 'pp') {
      ppInterviews
        .filter(interview => interview.interview_date === dateStr)
        .filter(interview => filterAssignee === 'all' || interview.sales_person === filterAssignee)
        .forEach(interview => {
          allEvents.push({
            id: `pp-${interview.id}`,
            title: `【PP】${interview.company_name}`,
            type: 'pp',
            time: interview.interview_time || '未定',
            data: interview,
            assignee: interview.sales_person,
            linkedTo: 'pp',
            linkedId: interview.id
          });
        });
    }

    // BP商談
    if (filterType === 'all' || filterType === 'bp') {
      bpProspects
        .filter(prospect => prospect.interview_date === dateStr)
        .filter(prospect => filterAssignee === 'all' || prospect.main_planner === filterAssignee)
        .forEach(prospect => {
          allEvents.push({
            id: `bp-${prospect.id}`,
            title: `【BP】${prospect.company_name}`,
            type: 'bp',
            time: prospect.interview_time || '未定',
            data: prospect,
            assignee: prospect.main_planner,
            linkedTo: 'bp',
            linkedId: prospect.id
          });
        });
    }

    // カスタムイベント（定期予定を含む）
    if (filterType === 'all' || filterType === 'other' || filterType === 'important') {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      events.forEach(event => {
        const expandedEvents = expandRecurringEvents(event, monthStart, monthEnd);
        expandedEvents
          .filter(e => e.date === dateStr)
          .filter(e => filterType === 'all' || e.type === filterType)
          .filter(e => filterAssignee === 'all' || e.assignee === filterAssignee)
          .forEach(e => {
            allEvents.push(e);
          });
      });
    }

    return allEvents.sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // 日付フォーマット
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 時刻フォーマット (HH:MM形式を時間数値に変換)
  const timeToNumber = (timeStr) => {
    if (!timeStr || timeStr === '未定') return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  // 表示期間を変更
  const changeDate = (delta) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (delta * 7));
    } else {
      newDate.setDate(newDate.getDate() + delta);
    }
    setCurrentDate(newDate);
  };

  // 今日に戻る
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // イベント追加
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('タイトルと日付は必須です');
      return;
    }

    const eventToAdd = {
      id: `custom-${Date.now()}`,
      ...newEvent
    };

    const updatedEvents = [...events, eventToAdd];
    saveEvents(updatedEvents);

    // プランナーリストを更新
    if (newEvent.assignee && !allAssignees.includes(newEvent.assignee)) {
      setAllAssignees([...allAssignees, newEvent.assignee]);
    }

    setNewEvent({
      title: '',
      type: 'other',
      date: '',
      time: '',
      endTime: '',
      description: '',
      assignee: '',
      reminder: 'none',
      isRecurring: false,
      recurringType: 'none',
      recurringEndDate: ''
    });
    setShowEventModal(false);
  };

  // イベント削除
  const handleDeleteEvent = (eventId) => {
    if (eventId.startsWith('custom-')) {
      const updatedEvents = events.filter(e => e.id !== eventId);
      saveEvents(updatedEvents);
      setShowDetailModal(false);
    } else {
      alert('PP/BP予定は元の画面から削除してください');
    }
  };

  // ドラッグ開始
  const handleDragStart = (e, event) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグオーバー
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // ドロップ
  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (!draggedEvent || !draggedEvent.id.startsWith('custom-')) {
      alert('カスタムイベントのみ移動可能です');
      setDraggedEvent(null);
      return;
    }

    const updatedEvents = events.map(event => {
      if (event.id === draggedEvent.id) {
        return { ...event, date: formatDate(targetDate) };
      }
      return event;
    });

    saveEvents(updatedEvents);
    setDraggedEvent(null);
  };

  // イベントタイプの色取得
  const getEventColor = (type) => {
    switch (type) {
      case 'pp':
        return 'bg-blue-500 border-blue-600';
      case 'bp':
        return 'bg-amber-500 border-amber-600';
      case 'important':
        return 'bg-red-500 border-red-600';
      case 'other':
      default:
        return 'bg-green-500 border-green-600';
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getDaysInWeek(currentDate);
  const today = new Date();
  const todayStr = formatDate(today);

  // 表示モードに応じた日付範囲テキスト
  const getDateRangeText = () => {
    if (viewMode === 'month') {
      return `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;
    } else if (viewMode === 'week') {
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      return `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    } else {
      return `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-calendar-alt text-white text-3xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">カレンダー</h1>
              <p className="text-slate-600">スケジュール管理 - Salesforce風</p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewEvent({ ...newEvent, date: todayStr });
              setShowEventModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <i className="fas fa-plus mr-2"></i>
            予定を追加
          </button>
        </div>

        {/* 表示モード切り替えとナビゲーション */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* 表示モード切り替え */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'month' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <i className="fas fa-calendar mr-2"></i>月
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'week' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <i className="fas fa-calendar-week mr-2"></i>週
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'day' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <i className="fas fa-calendar-day mr-2"></i>日
              </button>
            </div>

            {/* ナビゲーション */}
            <button
              onClick={() => changeDate(-1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <h2 className="text-2xl font-bold text-slate-800 min-w-[200px] text-center">
              {getDateRangeText()}
            </h2>
            <button
              onClick={() => changeDate(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold transition-colors"
            >
              <i className="fas fa-home mr-2"></i>今日
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-semibold">種類:</span>
            {['all', 'pp', 'bp', 'important', 'other'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                  filterType === type
                    ? type === 'all' ? 'bg-slate-700 text-white' :
                      type === 'pp' ? 'bg-blue-500 text-white' :
                      type === 'bp' ? 'bg-amber-500 text-white' :
                      type === 'important' ? 'bg-red-500 text-white' :
                      'bg-green-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'すべて' :
                 type === 'pp' ? 'PP' :
                 type === 'bp' ? 'BP' :
                 type === 'important' ? '重要' :
                 'その他'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-semibold">担当者:</span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-3 py-1 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 focus:outline-none"
            >
              <option value="all">すべて</option>
              {allAssignees.sort().map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 月表示カレンダーグリッド */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={day}
                className={`text-center font-bold py-3 rounded-lg ${
                  index === 0 ? 'text-red-600 bg-red-50' :
                  index === 6 ? 'text-blue-600 bg-blue-50' :
                  'text-slate-700 bg-slate-50'
                }`}
              >
                {day}
              </div>
            ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dateStr = formatDate(day.date);
            const isToday = dateStr === todayStr;
            const dayEvents = getEventsForDate(day.date);
            const isSunday = day.date.getDay() === 0;
            const isSaturday = day.date.getDay() === 6;

            return (
              <div
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.date)}
                className={`min-h-[120px] border-2 rounded-xl p-2 transition-all duration-200 ${
                  day.isCurrentMonth
                    ? isToday
                      ? 'bg-blue-50 border-blue-400 shadow-lg'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                    : 'bg-slate-50 border-slate-100'
                } ${draggedEvent ? 'cursor-copy' : ''}`}
              >
                {/* 日付 */}
                <div className={`text-right mb-1 font-semibold ${
                  day.isCurrentMonth
                    ? isToday
                      ? 'text-blue-600 text-lg'
                      : isSunday
                        ? 'text-red-600'
                        : isSaturday
                          ? 'text-blue-600'
                          : 'text-slate-700'
                    : 'text-slate-400'
                }`}>
                  {day.date.getDate()}
                  {isToday && <span className="ml-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">今日</span>}
                </div>

                {/* イベント一覧 */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      draggable={event.id.startsWith('custom-')}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowDetailModal(true);
                      }}
                      className={`text-xs px-2 py-1 rounded border-l-4 cursor-pointer hover:shadow-md transition-all ${
                        getEventColor(event.type)
                      } text-white truncate ${
                        event.id.startsWith('custom-') ? 'cursor-move' : ''
                      }`}
                      title={event.title}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">{event.time}</span>
                        <span className="truncate font-semibold">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 text-center bg-slate-100 rounded py-1">
                      +{dayEvents.length - 3}件
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* 週表示 */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6">
          {/* 時間軸付きグリッド */}
          <div className="flex">
            {/* 時刻列 */}
            <div className="w-20 flex-shrink-0">
              <div className="h-16"></div>
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="h-16 border-t border-slate-200 pt-1 pr-2 text-right text-xs text-slate-500">
                  {`${hour}:00`}
                </div>
              ))}
            </div>

            {/* 日付列 */}
            <div className="flex-1 grid grid-cols-7 gap-1">
              {weekDays.map((day, dayIndex) => {
                const dateStr = formatDate(day);
                const isToday = dateStr === todayStr;
                const dayEvents = getEventsForDate(day);
                const isSunday = day.getDay() === 0;
                const isSaturday = day.getDay() === 6;

                return (
                  <div key={dayIndex} className="relative">
                    {/* 日付ヘッダー */}
                    <div className={`h-16 flex flex-col items-center justify-center border-2 rounded-xl mb-1 ${
                      isToday 
                        ? 'bg-blue-500 text-white border-blue-600 shadow-lg' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`text-xs ${
                        isToday ? 'text-white' : 
                        isSunday ? 'text-red-600' : 
                        isSaturday ? 'text-blue-600' : 
                        'text-slate-600'
                      }`}>
                        {['日', '月', '火', '水', '木', '金', '土'][day.getDay()]}
                      </div>
                      <div className={`text-lg font-bold ${
                        isToday ? 'text-white' : 'text-slate-800'
                      }`}>
                        {day.getDate()}
                      </div>
                    </div>

                    {/* タイムグリッド */}
                    <div 
                      className="relative"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      {Array.from({ length: 24 }, (_, hour) => (
                        <div 
                          key={hour} 
                          className="h-16 border-t border-slate-200 hover:bg-blue-50/30 transition-colors"
                        ></div>
                      ))}

                      {/* イベント配置 */}
                      {dayEvents.map(event => {
                        const startHour = timeToNumber(event.time);
                        const endHour = event.endTime ? timeToNumber(event.endTime) : startHour + 1;
                        const top = startHour * 64; // 64px per hour
                        const height = (endHour - startHour) * 64;

                        return (
                          <div
                            key={event.id}
                            draggable={event.id.startsWith('custom-')}
                            onDragStart={(e) => handleDragStart(e, event)}
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDetailModal(true);
                            }}
                            className={`absolute left-0 right-0 mx-1 rounded-lg border-l-4 p-2 cursor-pointer hover:shadow-lg transition-all z-10 ${
                              getEventColor(event.type)
                            } text-white overflow-hidden ${
                              event.id.startsWith('custom-') ? 'cursor-move' : ''
                            }`}
                            style={{ 
                              top: `${top}px`, 
                              height: `${Math.max(height, 32)}px`,
                              minHeight: '32px'
                            }}
                          >
                            <div className="text-xs font-bold truncate">{event.time}</div>
                            <div className="text-sm font-semibold truncate">{event.title}</div>
                            {event.assignee && (
                              <div className="text-xs opacity-90 truncate mt-1">
                                <i className="fas fa-user mr-1"></i>{event.assignee}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 日表示 */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-6">
          <div className="flex gap-6">
            {/* 時刻列 */}
            <div className="w-24 flex-shrink-0">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="h-20 border-t border-slate-200 pt-2 pr-3 text-right">
                  <div className="text-sm font-semibold text-slate-700">{`${hour}:00`}</div>
                </div>
              ))}
            </div>

            {/* イベント列 */}
            <div className="flex-1 relative">
              {Array.from({ length: 24 }, (_, hour) => (
                <div 
                  key={hour} 
                  className="h-20 border-t border-slate-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => {
                    const hourStr = String(hour).padStart(2, '0');
                    setNewEvent({ ...newEvent, date: todayStr, time: `${hourStr}:00` });
                    setShowEventModal(true);
                  }}
                ></div>
              ))}

              {/* イベント配置 */}
              {getEventsForDate(currentDate).map(event => {
                const startHour = timeToNumber(event.time);
                const endHour = event.endTime ? timeToNumber(event.endTime) : startHour + 1;
                const top = startHour * 80; // 80px per hour
                const height = (endHour - startHour) * 80;

                return (
                  <div
                    key={event.id}
                    draggable={event.id.startsWith('custom-')}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailModal(true);
                    }}
                    className={`absolute left-0 right-0 rounded-xl border-l-4 p-4 cursor-pointer hover:shadow-xl transition-all z-10 ${
                      getEventColor(event.type)
                    } text-white ${
                      event.id.startsWith('custom-') ? 'cursor-move' : ''
                    }`}
                    style={{ 
                      top: `${top}px`, 
                      height: `${Math.max(height, 60)}px`,
                      minHeight: '60px'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-lg font-bold">{event.time}</div>
                      {event.endTime && (
                        <div className="text-sm opacity-90">- {event.endTime}</div>
                      )}
                    </div>
                    <div className="text-xl font-bold mb-2">{event.title}</div>
                    {event.assignee && (
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        <i className="fas fa-user"></i>
                        <span>{event.assignee}</span>
                      </div>
                    )}
                    {event.description && height > 100 && (
                      <div className="text-sm opacity-90 mt-2 line-clamp-2">
                        {event.description}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 現在時刻インジケーター（今日の場合） */}
              {formatDate(currentDate) === todayStr && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                  style={{ top: `${new Date().getHours() * 80 + (new Date().getMinutes() / 60) * 80}px` }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 新規イベント追加モーダル */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEventModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">新しい予定を追加</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">タイトル *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="予定のタイトル"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">種類</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="other">その他</option>
                  <option value="important">重要</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">日付 *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">開始時刻</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">終了時刻</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <i className="fas fa-bell mr-2 text-amber-500"></i>リマインダー
                </label>
                <select
                  value={newEvent.reminder}
                  onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">なし</option>
                  <option value="5min">5分前</option>
                  <option value="15min">15分前</option>
                  <option value="30min">30分前</option>
                  <option value="1hour">1時間前</option>
                  <option value="1day">1日前</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={newEvent.isRecurring}
                    onChange={(e) => setNewEvent({ ...newEvent, isRecurring: e.target.checked, recurringType: e.target.checked ? 'weekly' : 'none' })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    <i className="fas fa-redo mr-2 text-green-500"></i>定期予定
                  </span>
                </label>

                {newEvent.isRecurring && (
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="block text-xs text-slate-600 mb-2">繰り返し</label>
                      <select
                        value={newEvent.recurringType}
                        onChange={(e) => setNewEvent({ ...newEvent, recurringType: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="daily">毎日</option>
                        <option value="weekly">毎週</option>
                        <option value="monthly">毎月</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-2">終了日</label>
                      <input
                        type="date"
                        value={newEvent.recurringEndDate}
                        onChange={(e) => setNewEvent({ ...newEvent, recurringEndDate: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">担当者</label>
                <input
                  type="text"
                  value={newEvent.assignee}
                  onChange={(e) => setNewEvent({ ...newEvent, assignee: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="担当者名"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">詳細</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="詳細説明"
                ></textarea>
              </div>

              <button
                onClick={handleAddEvent}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
              >
                <i className="fas fa-plus mr-2"></i>
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* イベント詳細モーダル */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className={`bg-gradient-to-r ${
              selectedEvent.type === 'pp' ? 'from-blue-500 to-blue-600' :
              selectedEvent.type === 'bp' ? 'from-amber-500 to-yellow-600' :
              selectedEvent.type === 'important' ? 'from-red-500 to-red-600' :
              'from-green-500 to-green-600'
            } text-white p-6 rounded-t-3xl`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{selectedEvent.title}</h3>
                  <p className="text-white/80">{selectedEvent.time}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedEvent.type === 'pp' && selectedEvent.data && (
                <>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700 mb-1">エンジニア</p>
                    <p className="font-bold text-blue-900">{selectedEvent.data.engineer_name}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700 mb-1">営業担当</p>
                    <p className="font-bold text-blue-900">{selectedEvent.data.sales_person}</p>
                  </div>
                  {selectedEvent.data.notes && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-600 mb-1">備考</p>
                      <p className="text-slate-800">{selectedEvent.data.notes}</p>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-link text-blue-600"></i>
                        <span className="text-sm font-semibold text-blue-800">PP営業進捗画面で詳細を確認</span>
                      </div>
                      <i className="fas fa-external-link-alt text-blue-600"></i>
                    </div>
                  </div>
                </>
              )}

              {selectedEvent.type === 'bp' && selectedEvent.data && (
                <>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-700 mb-1">エンジニア</p>
                    <p className="font-bold text-amber-900">{selectedEvent.data.engineer_name}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-700 mb-1">メインプランナー</p>
                    <p className="font-bold text-amber-900">{selectedEvent.data.main_planner}</p>
                  </div>
                  {selectedEvent.data.priority && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-sm text-amber-700 mb-1">優先度</p>
                      <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                        selectedEvent.data.priority === '高' ? 'bg-red-500 text-white' :
                        selectedEvent.data.priority === '中' ? 'bg-yellow-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {selectedEvent.data.priority}
                      </span>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-link text-amber-600"></i>
                        <span className="text-sm font-semibold text-amber-800">BP進捗画面で詳細を確認</span>
                      </div>
                      <i className="fas fa-external-link-alt text-amber-600"></i>
                    </div>
                  </div>
                </>
              )}

              {(selectedEvent.type === 'other' || selectedEvent.type === 'important') && (
                <>
                  {selectedEvent.endTime && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-600 mb-1">時間</p>
                      <p className="font-bold text-slate-800">
                        {selectedEvent.time} - {selectedEvent.endTime}
                      </p>
                    </div>
                  )}
                  {selectedEvent.assignee && (
                    <div className={`${
                      selectedEvent.type === 'important' ? 'bg-red-50' : 'bg-green-50'
                    } rounded-xl p-4`}>
                      <p className={`text-sm ${
                        selectedEvent.type === 'important' ? 'text-red-700' : 'text-green-700'
                      } mb-1`}>担当者</p>
                      <p className={`font-bold ${
                        selectedEvent.type === 'important' ? 'text-red-900' : 'text-green-900'
                      }`}>{selectedEvent.assignee}</p>
                    </div>
                  )}
                  {selectedEvent.reminder && selectedEvent.reminder !== 'none' && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-sm text-amber-700 mb-1">
                        <i className="fas fa-bell mr-2"></i>リマインダー
                      </p>
                      <p className="font-bold text-amber-900">
                        {selectedEvent.reminder === '5min' ? '5分前' :
                         selectedEvent.reminder === '15min' ? '15分前' :
                         selectedEvent.reminder === '30min' ? '30分前' :
                         selectedEvent.reminder === '1hour' ? '1時間前' :
                         selectedEvent.reminder === '1day' ? '1日前' : ''}
                      </p>
                    </div>
                  )}
                  {selectedEvent.isRecurring && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-sm text-green-700 mb-1">
                        <i className="fas fa-redo mr-2"></i>定期予定
                      </p>
                      <p className="font-bold text-green-900">
                        {selectedEvent.recurringType === 'daily' ? '毎日' :
                         selectedEvent.recurringType === 'weekly' ? '毎週' :
                         selectedEvent.recurringType === 'monthly' ? '毎月' : ''}
                        {selectedEvent.recurringEndDate && ` (${selectedEvent.recurringEndDate}まで)`}
                      </p>
                    </div>
                  )}
                  {selectedEvent.description && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-600 mb-1">詳細</p>
                      <p className="text-slate-800 whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('この予定を削除しますか?')) {
                        handleDeleteEvent(selectedEvent.id);
                      }
                    }}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
