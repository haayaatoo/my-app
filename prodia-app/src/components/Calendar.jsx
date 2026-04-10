import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

const Calendar = () => {
  const toast = useToast();
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

  // Google Calendar 連携
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleSyncing, setGoogleSyncing] = useState(false);

  // データ抽出パネル
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    startDate: '',
    endDate: '',
    keyword: '',
    format: 'csv',
    fields: {
      title: true,
      date: true,
      start_time: true,
      end_time: true,
      description: true,
      location: true,
      organizer: false,
      status: false,
    },
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPreview, setExportPreview] = useState(null); // JSON プレビュー用

  // 編集中のイベント
  const [editingEvent, setEditingEvent] = useState(null);

  // Google認証状態の確認
  useEffect(() => {
    fetch('/api/calendar/oauth/status/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setGoogleConnected(data.connected);
        if (data.connected) fetchGoogleEvents();
      })
      .catch(() => {});
  }, []);

  // ポップアップからのメッセージ受信（OAuth完了通知）
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleConnected(true);
        fetchGoogleEvents();
      } else if (e.data?.type === 'GOOGLE_AUTH_ERROR') {
        toast.error('Google認証に失敗しました: ' + e.data.error);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // GoogleカレンダーイベントをProdiaのフォーマットに変換
  const convertGoogleEvent = (gEvent) => {
    const start = gEvent.start?.dateTime || gEvent.start?.date || '';
    const date = start.substring(0, 10);
    const time = start.length > 10 ? start.substring(11, 16) : '';
    const endRaw = gEvent.end?.dateTime || gEvent.end?.date || '';
    const endTime = endRaw.length > 10 ? endRaw.substring(11, 16) : '';
    return {
      id: `google-${gEvent.id}`,
      googleId: gEvent.id,
      title: gEvent.summary || '（タイトルなし）',
      type: 'google',
      date,
      time,
      endTime,
      description: gEvent.description || '',
      assignee: '',
      reminder: 'none',
      isRecurring: false,
    };
  };

  // Googleカレンダーのイベントを取得
  const fetchGoogleEvents = () => {
    setGoogleSyncing(true);
    fetch('/api/calendar/events/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setGoogleEvents(data.events.map(convertGoogleEvent));
        }
      })
      .catch(() => toast.error('Googleカレンダーの取得に失敗しました'))
      .finally(() => setGoogleSyncing(false));
  };

  // Google連携開始
  const connectGoogle = () => {
    fetch('/api/calendar/oauth/start/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.auth_url) {
          window.open(data.auth_url, 'google_auth', 'width=500,height=650,left=200,top=100');
        }
      })
      .catch(() => toast.error('Google連携の開始に失敗しました'));
  };

  // Google連携解除
  const disconnectGoogle = () => {
    if (!window.confirm('Googleカレンダーの連携を解除しますか？')) return;
    fetch('/api/calendar/oauth/disconnect/', { credentials: 'include' })
      .then(() => {
        setGoogleConnected(false);
        setGoogleEvents([]);
      });
  };

  // Googleカレンダー データ抽出
  const handleExport = () => {
    const selectedFields = Object.entries(exportSettings.fields)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',');

    if (!selectedFields) {
      toast.warning('出力する項目を1つ以上選択してください');
      return;
    }

    const params = new URLSearchParams();
    if (exportSettings.startDate) params.set('start_date', exportSettings.startDate);
    if (exportSettings.endDate) params.set('end_date', exportSettings.endDate);
    if (exportSettings.keyword) params.set('keyword', exportSettings.keyword);
    params.set('fields', selectedFields);
    params.set('format', exportSettings.format);

    const url = `/api/calendar/events/export/?${params.toString()}`;

    if (exportSettings.format === 'json') {
      setExportLoading(true);
      fetch(url, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            toast.error('抽出エラー: ' + data.error);
          } else {
            setExportPreview(data);
          }
        })
        .catch(() => toast.error('データ抽出に失敗しました'))
        .finally(() => setExportLoading(false));
    } else {
      // CSVはリンクを動的に作成してダウンロード
      setExportLoading(true);
      fetch(url, { credentials: 'include' })
        .then(res => {
          if (!res.ok) return res.json().then(d => Promise.reject(d.error || '抽出失敗'));
          return res.blob();
        })
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          const startStr = exportSettings.startDate || 'all';
          const endStr = exportSettings.endDate || 'all';
          a.download = `google_calendar_${startStr}_${endStr}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(err => toast.error('データ抽出に失敗しました: ' + err))
        .finally(() => setExportLoading(false));
    }
  };

  // PP面談データ取得
  useEffect(() => {
    fetch('/api/interviews/')
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
    fetch('/api/bp-prospects/')
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

    // Googleカレンダーイベント
    if (googleConnected && (filterType === 'all' || filterType === 'google')) {
      googleEvents
        .filter(e => e.date === dateStr)
        .forEach(e => allEvents.push(e));
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

  // イベント追加・更新共通のフォームリセット
  const resetEventForm = () => {
    setNewEvent({
      title: '', type: 'other', date: '', time: '', endTime: '',
      description: '', assignee: '', reminder: 'none',
      isRecurring: false, recurringType: 'none', recurringEndDate: ''
    });
    setEditingEvent(null);
    setShowEventModal(false);
  };

  // イベント追加
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.warning('タイトルと日付は必須です');
      return;
    }

    // 編集モード
    if (editingEvent) {
      handleUpdateEvent();
      return;
    }

    if (googleConnected) {
      // Google連携中はGoogleカレンダーのみに保存（localStorageには保存しない）
      fetch('/api/calendar/events/create/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
        .then(res => res.json())
        .then(data => {
          if (data.event) {
            setGoogleEvents(prev => [...prev, convertGoogleEvent(data.event)]);
          }
        })
        .catch(() => {
          // Googleへの追加失敗時はlocalStorageに保存
          const eventToAdd = { id: `custom-${Date.now()}`, ...newEvent };
          saveEvents([...events, eventToAdd]);
          toast.warning('Googleカレンダーへの追加に失敗したため、Prodia内に保存しました');
        });
    } else {
      // Google未連携時はlocalStorageに保存
      const eventToAdd = { id: `custom-${Date.now()}`, ...newEvent };
      saveEvents([...events, eventToAdd]);
    }

    // プランナーリストを更新
    if (newEvent.assignee && !allAssignees.includes(newEvent.assignee)) {
      setAllAssignees([...allAssignees, newEvent.assignee]);
    }

    resetEventForm();
  };

  // イベント編集モード開始
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title || '',
      type: event.type === 'google' ? 'other' : (event.type || 'other'),
      date: event.date || '',
      time: event.time || '',
      endTime: event.endTime || '',
      description: event.description || '',
      assignee: event.assignee || '',
      reminder: event.reminder || 'none',
      isRecurring: event.isRecurring || false,
      recurringType: event.recurringType || 'none',
      recurringEndDate: event.recurringEndDate || '',
    });
    setShowDetailModal(false);
    setShowEventModal(true);
  };

  // イベント更新
  const handleUpdateEvent = () => {
    if (!editingEvent) return;

    if (editingEvent.id.startsWith('google-')) {
      const googleId = editingEvent.googleId;
      fetch(`/api/calendar/events/${googleId}/update/`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })
        .then(res => res.json())
        .then(data => {
          if (data.event) {
            setGoogleEvents(prev =>
              prev.map(e => e.id === editingEvent.id ? convertGoogleEvent(data.event) : e)
            );
          }
        })
        .catch(() => toast.error('Google予定の更新に失敗しました'));
    } else if (editingEvent.id.startsWith('custom-')) {
      const updatedEvents = events.map(e =>
        e.id === editingEvent.id ? { ...e, ...newEvent } : e
      );
      saveEvents(updatedEvents);
    }

    resetEventForm();
  };

  // イベント削除
  const handleDeleteEvent = (eventId) => {
    if (eventId.startsWith('google-')) {
      const googleId = eventId.replace('google-', '');
      fetch(`/api/calendar/events/${googleId}/delete/`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then(() => {
          setGoogleEvents(prev => prev.filter(e => e.id !== eventId));
          setShowDetailModal(false);
        })
        .catch(() => toast.error('Googleカレンダーからの削除に失敗しました'));
    } else if (eventId.startsWith('custom-')) {
      const updatedEvents = events.filter(e => e.id !== eventId);
      saveEvents(updatedEvents);
      setShowDetailModal(false);
    } else {
      toast.warning('PP/BP予定は元の画面から削除してください');
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
      toast.warning('カスタムイベントのみ移動可能です');
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
      case 'google':
        return 'bg-teal-500 border-teal-600';
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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* ページヘッダー */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm flex-shrink-0 space-y-3">
        {/* Row 1: タイトル + Google + 予定追加 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <i className="fas fa-calendar-alt text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">カレンダー</h1>
              <p className="text-xs text-slate-400 mt-0.5">スケジュール管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <div className="flex items-center gap-1.5">
                <button onClick={fetchGoogleEvents} disabled={googleSyncing} className="px-3 py-1.5 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5">
                  <i className={`fas fa-sync-alt ${googleSyncing ? 'animate-spin' : ''} text-[10px]`}></i>
                  同期
                </button>
                <button onClick={disconnectGoogle} className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3 h-3" />
                  連携中
                </button>
                <button onClick={() => { setShowExportPanel(p => !p); setExportPreview(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${showExportPanel ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                  <i className="fas fa-file-export text-[10px]"></i>
                  データ抽出
                </button>
              </div>
            ) : (
              <button onClick={connectGoogle} className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-400 text-slate-700 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3 h-3" />
                Googleカレンダーと連携
              </button>
            )}
            <button
              onClick={() => { setNewEvent({ ...newEvent, date: todayStr }); setShowEventModal(true); }}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all"
            >
              <i className="fas fa-plus mr-1.5 text-[10px]"></i>予定を追加
            </button>
          </div>
        </div>
        {/* Row 2: 表示モード + ナビゲーション + フィルター */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
              {[
                { key: 'month', icon: 'fa-calendar',      label: '月' },
                { key: 'week',  icon: 'fa-calendar-week', label: '週' },
                { key: 'day',   icon: 'fa-calendar-day',  label: '日' },
              ].map(({ key, icon, label }) => (
                <button key={key} onClick={() => setViewMode(key)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                  <i className={`fas ${icon} mr-1`}></i>{label}
                </button>
              ))}
            </div>
            <button onClick={() => changeDate(-1)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            <span className="text-sm font-bold text-slate-800 min-w-[160px] text-center">{getDateRangeText()}</span>
            <button onClick={() => changeDate(1)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-600">
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-semibold transition-colors">
              <i className="fas fa-home mr-1"></i>今日
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[
                { key: 'all',       label: 'すべて', color: 'bg-slate-700' },
                { key: 'pp',        label: 'PP',     color: 'bg-blue-500' },
                { key: 'bp',        label: 'BP',     color: 'bg-amber-500' },
                { key: 'important', label: '重要',   color: 'bg-red-500' },
                { key: 'other',     label: 'その他', color: 'bg-green-500' },
                ...(googleConnected ? [{ key: 'google', label: 'Google', color: 'bg-teal-500' }] : []),
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => setFilterType(key)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${filterType === key ? `${color} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none">
              <option value="all">全担当者</option>
              {allAssignees.sort().map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">

        {/* データ抽出パネル */}
        {showExportPanel && googleConnected && (
          <div className="mb-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
              <i className="fas fa-file-export text-indigo-600"></i>
              Googleカレンダー データ抽出
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">抽出期間（開始）</label>
                <input type="date" value={exportSettings.startDate} onChange={e => setExportSettings(s => ({ ...s, startDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">抽出期間（終了）</label>
                <input type="date" value={exportSettings.endDate} onChange={e => setExportSettings(s => ({ ...s, endDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">キーワード絞り込み <span className="ml-2 text-xs font-normal text-slate-500">カンマ区切りでAND検索（例: 面談,田中）</span></label>
                <input type="text" value={exportSettings.keyword} onChange={e => setExportSettings(s => ({ ...s, keyword: e.target.value }))} placeholder="キーワードなしで全件抽出" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">出力する項目</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'title', label: 'タイトル' }, { key: 'date', label: '日付' },
                  { key: 'start_time', label: '開始時刻' }, { key: 'end_time', label: '終了時刻' },
                  { key: 'description', label: '説明' }, { key: 'location', label: '場所' },
                  { key: 'organizer', label: '主催者メール' }, { key: 'status', label: 'ステータス' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm hover:border-indigo-300 transition-colors">
                    <input type="checkbox" checked={exportSettings.fields[key]} onChange={e => setExportSettings(s => ({ ...s, fields: { ...s.fields, [key]: e.target.checked } }))} className="accent-indigo-500" />
                    <span className="font-medium text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700">出力形式:</label>
                <label className="flex items-center gap-1 cursor-pointer text-sm">
                  <input type="radio" value="csv" checked={exportSettings.format === 'csv'} onChange={() => { setExportSettings(s => ({ ...s, format: 'csv' })); setExportPreview(null); }} className="accent-indigo-500" />
                  CSV（Excel対応）
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-sm">
                  <input type="radio" value="json" checked={exportSettings.format === 'json'} onChange={() => { setExportSettings(s => ({ ...s, format: 'json' })); setExportPreview(null); }} className="accent-indigo-500" />
                  JSON（プレビュー）
                </label>
              </div>
              <button onClick={handleExport} disabled={exportLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                {exportLoading ? <><i className="fas fa-spinner animate-spin"></i> 抽出中...</> : <><i className="fas fa-download"></i> {exportSettings.format === 'csv' ? 'CSVダウンロード' : 'データ取得'}</>}
              </button>
            </div>
            {exportPreview && (
              <div className="mt-4 bg-white border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-indigo-700"><i className="fas fa-list mr-1"></i>{exportPreview.count}件 取得</span>
                  <button onClick={() => setExportPreview(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕ 閉じる</button>
                </div>
                <div className="overflow-auto max-h-64 text-xs font-mono text-slate-700 bg-slate-50 rounded-lg p-3">
                  <pre>{JSON.stringify(exportPreview.events, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

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
                <i className={`fas ${editingEvent ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                {editingEvent ? '更新' : '追加'}
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

              {selectedEvent.type === 'google' && (
                <>
                  {selectedEvent.endTime && (
                    <div className="bg-teal-50 rounded-xl p-4">
                      <p className="text-sm text-teal-700 mb-1">時間</p>
                      <p className="font-bold text-teal-900">
                        {selectedEvent.time} - {selectedEvent.endTime}
                      </p>
                    </div>
                  )}
                  {selectedEvent.description && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-600 mb-1">詳細</p>
                      <p className="text-slate-800 whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditEvent(selectedEvent)}
                      className="flex-1 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <i className="fas fa-edit mr-2"></i>編集
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('この予定をGoogleカレンダーから削除しますか?')) {
                          handleDeleteEvent(selectedEvent.id);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <i className="fas fa-trash mr-2"></i>削除
                    </button>
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
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditEvent(selectedEvent)}
                      className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <i className="fas fa-edit mr-2"></i>編集
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('この予定を削除しますか?')) {
                          handleDeleteEvent(selectedEvent.id);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <i className="fas fa-trash mr-2"></i>削除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Calendar;
