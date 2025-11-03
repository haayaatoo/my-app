import React, { useState, useEffect } from 'react';

// カウントアップアニメーション用のカスタムフック
const useCountUp = (end, duration = 1000, delay = 0) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // イージング関数（ease-out）
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(end * easeOut));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, delay);

    return () => clearTimeout(timer);
  }, [end, duration, delay, isVisible]);

  const startAnimation = () => setIsVisible(true);

  return [count, startAnimation];
};

export default function RecruitmentMarketing() {
  const [viewMode, setViewMode] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // モーダル関連のstate
  const [showNewApplicantModal, setShowNewApplicantModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  
  // ページネーション用のstate
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 1ページあたりの表示件数
  
  // SNS管理用のstate
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [snsSearchTerm, setSnsSearchTerm] = useState('');
  const [snsSortBy, setSnsSortBy] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  
  // 新規応募者フォームのstate
  const [newApplicant, setNewApplicant] = useState({
    applicant_name: '',
    email: '',
    phone: '',
    channel: 'website',
    status: 'applied',
    notes: ''
  });
  const [animationsStarted, setAnimationsStarted] = useState(false);

  useEffect(() => {
    const generateData = () => {
      const apps = [];
      const posts = [];
      const now = new Date();
      const channels = ['sns_instagram', 'sns_x', 'sns_tiktok', 'website', 'referral'];
      const statuses = ['applied', 'screening', 'interview', 'hired', 'rejected', 'withdrawn'];
      
      // 詳細な応募者データ生成
      for (let i = 0; i < 120; i++) {
        const monthsAgo = Math.floor(Math.random() * 12);
        const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
        const updatedDate = new Date(date.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        
        apps.push({
          id: i + 1,
          applicant_name: `応募者${i + 1}`,
          email: `applicant${i + 1}@example.com`,
          phone: `090-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          channel: channels[i % channels.length],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          experience_years: Math.floor(Math.random() * 10),
          position_applied: ['フロントエンドエンジニア', 'バックエンドエンジニア', 'フルスタックエンジニア', 'インフラエンジニア'][Math.floor(Math.random() * 4)],
          created_at: date.toISOString(),
          updated_at: updatedDate.toISOString()
        });
      }
      
      // 詳細なSNS投稿データ生成
      for (let i = 0; i < 80; i++) {
        const monthsAgo = Math.floor(Math.random() * 12);
        const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1);
        const platform = ['tiktok', 'instagram', 'x'][i % 3];
        
        const baseViews = platform === 'tiktok' ? 50000 : platform === 'instagram' ? 20000 : 10000;
        const views = Math.floor(Math.random() * baseViews) + baseViews / 4;
        const likes = Math.floor(views * (Math.random() * 0.1 + 0.02)); // 2-12%のエンゲージメント率
        const comments = Math.floor(likes * (Math.random() * 0.3 + 0.05)); // コメント数
        const shares = Math.floor(likes * (Math.random() * 0.2 + 0.02)); // シェア数
        const dm_count = Math.floor(views * (Math.random() * 0.005 + 0.001)); // DM数
        
        posts.push({
          id: i + 1,
          platform: platform,
          title: `${platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : 'X'}投稿${i + 1}`,
          content: `エンジニア採用に関する投稿コンテンツ #エンジニア採用 #プログラマー ${platform === 'tiktok' ? '#転職 #IT' : ''}`,
          date: date.toISOString(),
          views_count: views,
          likes_count: likes,
          comments_count: comments,
          shares_count: shares,
          dm_count: dm_count,
          impressions_count: Math.floor(views * (Math.random() * 2 + 1.5)), // インプレッション数
          engagement_rate: ((likes + comments + shares) / views * 100).toFixed(2),
          reach: Math.floor(views * (Math.random() * 0.8 + 0.6)), // リーチ数
          saves_count: platform !== 'x' ? Math.floor(likes * (Math.random() * 0.15 + 0.05)) : 0 // 保存数（Xは除く）
        });
      }
      
      setApplications(apps);
      setSocialPosts(posts);
      setLoading(false);
    };
    
    generateData();
  }, []);

  const getStatistics = () => {
    // 月別フィルタリングされたデータ
    let filteredApplications = applications;
    let filteredSocialPosts = socialPosts;
    
    if (selectedMonth) {
      filteredApplications = applications.filter(app => {
        const date = new Date(app.created_at);
        return date.toISOString().slice(0, 7) === selectedMonth;
      });
      
      filteredSocialPosts = socialPosts.filter(post => {
        const date = new Date(post.date);
        return date.toISOString().slice(0, 7) === selectedMonth;
      });
    }
    
    // 基本統計
    const total = filteredApplications.length;
    const hired = filteredApplications.filter(app => app.status === 'hired').length;
    const screening = filteredApplications.filter(app => app.status === 'screening').length;
    const interview = filteredApplications.filter(app => app.status === 'interview').length;
    const rejected = filteredApplications.filter(app => app.status === 'rejected').length;
    const withdrawn = filteredApplications.filter(app => app.status === 'withdrawn').length;
    const applied = filteredApplications.filter(app => app.status === 'applied').length;
    
    const hiringRate = total > 0 ? ((hired / total) * 100).toFixed(1) : 0;
    
    // チャネル別統計
    const channelStats = {};
    filteredApplications.forEach(app => {
      if (!channelStats[app.channel]) {
        channelStats[app.channel] = { total: 0, hired: 0, rate: 0 };
      }
      channelStats[app.channel].total++;
      if (app.status === 'hired') {
        channelStats[app.channel].hired++;
      }
    });
    
    // チャネル別採用率計算
    Object.keys(channelStats).forEach(channel => {
      const stat = channelStats[channel];
      stat.rate = stat.total > 0 ? ((stat.hired / stat.total) * 100).toFixed(1) : 0;
    });

    // SNS統計
    const snsStats = {
      totalPosts: filteredSocialPosts.length,
      totalViews: filteredSocialPosts.reduce((sum, post) => sum + post.views_count, 0),
      totalLikes: filteredSocialPosts.reduce((sum, post) => sum + post.likes_count, 0),
      totalComments: filteredSocialPosts.reduce((sum, post) => sum + post.comments_count, 0),
      totalShares: filteredSocialPosts.reduce((sum, post) => sum + post.shares_count, 0),
      totalDMs: filteredSocialPosts.reduce((sum, post) => sum + post.dm_count, 0),
      totalImpressions: filteredSocialPosts.reduce((sum, post) => sum + post.impressions_count, 0),
      avgEngagementRate: filteredSocialPosts.length > 0 ? 
        (filteredSocialPosts.reduce((sum, post) => sum + parseFloat(post.engagement_rate), 0) / filteredSocialPosts.length).toFixed(2) : 0
    };

    return {
      totalApplications: total,
      hired: hired,
      screening: screening,
      interview: interview,
      rejected: rejected,
      withdrawn: withdrawn,
      applied: applied,
      hiringRate: hiringRate,
      channelStats: channelStats,
      snsStats: snsStats
    };
  };

  const generateMonths = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: date.toISOString().slice(0, 7),
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
      });
    }
    
    return months;
  };

  const stats = getStatistics();

  // アニメーション用のカウントアップフック
  const [totalAppsCount, startTotalAppsAnimation] = useCountUp(loading ? 0 : stats.totalApplications, 1200, 0);
  const [hiredCount, startHiredAnimation] = useCountUp(loading ? 0 : stats.hired, 1200, 200);
  const [screeningInterviewCount, startScreeningInterviewAnimation] = useCountUp(loading ? 0 : stats.screening + stats.interview, 1200, 400);
  const [postsCount, startPostsAnimation] = useCountUp(loading ? 0 : stats.snsStats.totalPosts, 1200, 600);
  const [impressionsCount, startImpressionsAnimation] = useCountUp(loading ? 0 : stats.snsStats.totalImpressions, 1500, 800);
  const [likesCount, startLikesAnimation] = useCountUp(loading ? 0 : stats.snsStats.totalLikes, 1500, 1000);
  const [dmsCount, startDMsAnimation] = useCountUp(loading ? 0 : stats.snsStats.totalDMs, 1500, 1200);
  const [commentsCount, startCommentsAnimation] = useCountUp(loading ? 0 : stats.snsStats.totalComments, 1500, 1400);

  // データ読み込み完了時にアニメーション開始
  useEffect(() => {
    if (!loading && !animationsStarted) {
      setTimeout(() => {
        startTotalAppsAnimation();
        startHiredAnimation();
        startScreeningInterviewAnimation();
        startPostsAnimation();
        startImpressionsAnimation();
        startLikesAnimation();
        startDMsAnimation();
        startCommentsAnimation();
        setAnimationsStarted(true);
      }, 500);
    }
  }, [loading, animationsStarted, startTotalAppsAnimation, startHiredAnimation, startScreeningInterviewAnimation, startPostsAnimation, startImpressionsAnimation, startLikesAnimation, startDMsAnimation, startCommentsAnimation]);

  // 応募者管理の関数群
  const handleAddApplicant = () => {
    const id = Math.max(...applications.map(app => app.id), 0) + 1;
    const newApp = {
      ...newApplicant,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setApplications([...applications, newApp]);
    setNewApplicant({
      applicant_name: '',
      email: '',
      phone: '',
      channel: 'website',
      status: 'applied',
      notes: ''
    });
    setShowNewApplicantModal(false);
  };

  const handleViewDetail = (applicant) => {
    setSelectedApplicant(applicant);
    setShowDetailModal(true);
  };

  const handleEditApplicant = (applicant) => {
    setSelectedApplicant(applicant);
    setNewApplicant({
      applicant_name: applicant.applicant_name,
      email: applicant.email,
      phone: applicant.phone,
      channel: applicant.channel,
      status: applicant.status,
      notes: applicant.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateApplicant = () => {
    const updatedApplications = applications.map(app => 
      app.id === selectedApplicant.id 
        ? { ...app, ...newApplicant, updated_at: new Date().toISOString() }
        : app
    );
    
    setApplications(updatedApplications);
    setShowEditModal(false);
    setSelectedApplicant(null);
    setNewApplicant({
      applicant_name: '',
      email: '',
      phone: '',
      channel: 'website',
      status: 'applied',
      notes: ''
    });
  };

  const handleDeleteApplicant = (applicantId) => {
    if (window.confirm('この応募者を削除してもよろしいですか？')) {
      setApplications(applications.filter(app => app.id !== applicantId));
    }
  };

  // 応募者のフィルタリングとソート
  const getFilteredAndSortedApplications = () => {
    let filtered = applications.filter(app => {
      const matchesStatus = selectedStatus === '' || app.status === selectedStatus;
      const matchesSearch = searchTerm === '' || 
        app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phone.includes(searchTerm);
      
      return matchesStatus && matchesSearch;
    });

    if (sortBy) {
      filtered = filtered.sort((a, b) => {
        switch (sortBy) {
          case 'date_desc':
            return new Date(b.created_at) - new Date(a.created_at);
          case 'date_asc':
            return new Date(a.created_at) - new Date(b.created_at);
          case 'name_asc':
            return a.applicant_name.localeCompare(b.applicant_name);
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  // ページネーション関数
  const getPaginatedApplications = () => {
    const filteredApps = getFilteredAndSortedApplications();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApps.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredApps = getFilteredAndSortedApplications();
    return Math.ceil(filteredApps.length / itemsPerPage);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 検索やフィルターが変更されたときにページを1に戻す
  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  // 検索やステータス変更時にページをリセット
  useEffect(() => {
    resetToFirstPage();
  }, [searchTerm, selectedStatus, sortBy]);

  // SNS投稿のフィルタリングとソート
  const getFilteredAndSortedPosts = () => {
    let filtered = socialPosts.filter(post => {
      const matchesPlatform = selectedPlatform === '' || post.platform === selectedPlatform;
      const matchesSearch = snsSearchTerm === '' || 
        post.title.toLowerCase().includes(snsSearchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(snsSearchTerm.toLowerCase());
      
      return matchesPlatform && matchesSearch;
    });

    if (snsSortBy) {
      filtered = filtered.sort((a, b) => {
        switch (snsSortBy) {
          case 'engagement_desc':
            return parseFloat(b.engagement_rate) - parseFloat(a.engagement_rate);
          case 'views_desc':
            return b.views_count - a.views_count;
          case 'date_desc':
            return new Date(b.date) - new Date(a.date);
          case 'likes_desc':
            return b.likes_count - a.likes_count;
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  // 新規投稿の初期状態
  const [newPost, setNewPost] = useState({
    platform: 'instagram',
    title: '',
    content: '',
    date: new Date().toISOString().slice(0, 16),
    target_audience: '',
    expected_engagement: '',
    media_file: null
  });

  // 新規投稿作成
  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) {
      alert('タイトルと投稿内容は必須です。');
      return;
    }

    const post = {
      id: socialPosts.length + 1,
      platform: newPost.platform,
      title: newPost.title,
      content: newPost.content,
      date: newPost.date,
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      comments_count: 0,
      engagement_rate: '0.0',
      target_audience: newPost.target_audience,
      expected_engagement: newPost.expected_engagement
    };

    setSocialPosts([post, ...socialPosts]);
    setShowNewPostModal(false);
    setNewPost({
      platform: 'instagram',
      title: '',
      content: '',
      date: new Date().toISOString().slice(0, 16),
      target_audience: '',
      expected_engagement: '',
      media_file: null
    });
    
    // 成功メッセージを表示
    alert('新しい投稿を作成しました！');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-stone-50 via-blue-50/20 to-slate-100 min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <i className={`fas ${
                viewMode === 'dashboard' ? 'fa-chart-pie text-blue-500' :
                viewMode === 'applications' ? 'fa-users text-green-500' :
                'fa-video text-purple-500'
              }`}></i>
              {viewMode === 'dashboard' ? '採用マーケティング分析' :
               viewMode === 'applications' ? '応募者管理' :
               'SNS投稿管理'}
            </h1>
            <p className="text-slate-600">
              {viewMode === 'dashboard' ? '採用経路と応募者データの詳細分析' :
               viewMode === 'applications' ? '応募者情報の管理と選考プロセスの追跡' :
               'SNSマーケティングの投稿管理と効果測定'}
            </p>
          </div>
          
          <div className="flex bg-white rounded-2xl p-1 shadow-lg">
            {[
              { key: 'dashboard', icon: 'fa-chart-pie', label: 'ダッシュボード' },
              { key: 'applications', icon: 'fa-users', label: '応募管理' },
              { key: 'posts', icon: 'fa-video', label: 'SNS管理' }
            ].map(mode => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === mode.key
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <i className={`fas ${mode.icon}`}></i>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <div className="space-y-8">
          {/* 月別フィルタ */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700">期間別分析</h3>
              <div className="flex items-center gap-4">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">全期間表示</option>
                  {generateMonths().map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {selectedMonth && (
                  <button
                    onClick={() => setSelectedMonth('')}
                    className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 基本統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">総応募数</p>
                  <p className="text-3xl font-bold">
                    <span className="tabular-nums">{totalAppsCount.toLocaleString()}</span>
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    {selectedMonth ? '選択月' : '全期間'}
                  </p>
                </div>
                <i className="fas fa-user-plus text-4xl text-blue-200 animate-bounce"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">採用数</p>
                  <p className="text-3xl font-bold">
                    <span className="tabular-nums">{hiredCount.toLocaleString()}</span>
                  </p>
                  <p className="text-emerald-200 text-xs mt-1">
                    率: {stats.hiringRate}%
                  </p>
                </div>
                <i className="fas fa-user-check text-4xl text-emerald-200 animate-pulse"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">選考中</p>
                  <p className="text-3xl font-bold">
                    <span className="tabular-nums">{screeningInterviewCount.toLocaleString()}</span>
                  </p>
                  <p className="text-purple-200 text-xs mt-1">
                    書類: {stats.screening} / 面接: {stats.interview}
                  </p>
                </div>
                <i className="fas fa-clipboard-list text-4xl text-purple-200 animate-spin-slow"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">SNS投稿数</p>
                  <p className="text-3xl font-bold">
                    <span className="tabular-nums">{postsCount.toLocaleString()}</span>
                  </p>
                  <p className="text-amber-200 text-xs mt-1">
                    エンゲージ率: {stats.snsStats.avgEngagementRate}%
                  </p>
                </div>
                <i className="fas fa-video text-4xl text-amber-200 animate-bounce"></i>
              </div>
            </div>
          </div>

          {/* SNS詳細統計 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-pink-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-slideInLeft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">総インプレッション</p>
                  <p className="text-2xl font-bold text-slate-800">
                    <span className="tabular-nums">{impressionsCount.toLocaleString()}</span>
                  </p>
                </div>
                <i className="fas fa-eye text-2xl text-pink-500 animate-pulse"></i>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">総いいね数</p>
                  <p className="text-2xl font-bold text-slate-800">
                    <span className="tabular-nums">{likesCount.toLocaleString()}</span>
                  </p>
                </div>
                <i className="fas fa-heart text-2xl text-red-500 animate-heartbeat"></i>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">総DM数</p>
                  <p className="text-2xl font-bold text-slate-800">
                    <span className="tabular-nums">{dmsCount.toLocaleString()}</span>
                  </p>
                </div>
                <i className="fas fa-envelope text-2xl text-blue-500 animate-bounce"></i>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">総コメント数</p>
                  <p className="text-2xl font-bold text-slate-800">
                    <span className="tabular-nums">{commentsCount.toLocaleString()}</span>
                  </p>
                </div>
                <i className="fas fa-comment text-2xl text-green-500 animate-wiggle"></i>
              </div>
            </div>
          </div>

          {/* 採用経路別実績 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                <i className="fas fa-route text-blue-500"></i>
                採用経路別実績 詳細分析
              </h3>
              <div className="space-y-6">
                {Object.entries(stats.channelStats).map(([channel, data]) => {
                  const getChannelName = (ch) => {
                    const names = {
                      sns_instagram: 'Instagram',
                      sns_x: 'X (Twitter)',
                      sns_tiktok: 'TikTok',
                      website: 'HP応募フォーム',
                      referral: 'リファラル・紹介'
                    };
                    return names[ch] || ch;
                  };
                  
                  const getChannelIcon = (ch) => {
                    const icons = {
                      sns_instagram: 'fab fa-instagram text-pink-500',
                      sns_x: 'fab fa-x-twitter text-black',
                      sns_tiktok: 'fab fa-tiktok text-black',
                      website: 'fas fa-globe text-blue-500',
                      referral: 'fas fa-user-friends text-green-500'
                    };
                    return icons[ch] || 'fas fa-question-circle text-slate-500';
                  };

                  const getChannelBg = (ch) => {
                    const backgrounds = {
                      sns_instagram: 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200',
                      sns_x: 'bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200',
                      sns_tiktok: 'bg-gradient-to-r from-slate-50 to-gray-50 border-gray-200',
                      website: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200',
                      referral: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                    };
                    return backgrounds[ch] || 'bg-slate-50 border-slate-200';
                  };

                  // 採用効率の可視化バー
                  const conversionBarWidth = data.total > 0 ? (data.hired / data.total) * 100 : 0;
                  
                  return (
                    <div key={channel} className={`${getChannelBg(channel)} border-2 rounded-xl p-5 hover:shadow-md transition-all`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <i className={`${getChannelIcon(channel)} text-2xl`}></i>
                          <div>
                            <span className="font-bold text-slate-800 text-lg">{getChannelName(channel)}</span>
                            <p className="text-sm text-slate-600">採用効率: {data.rate}%</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-800">{data.total}件</div>
                          <div className="text-sm text-slate-500">総応募数</div>
                        </div>
                      </div>
                      
                      {/* 採用プロセス可視化 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">応募者数</span>
                          <span className="font-bold text-blue-600">{data.total}人</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">採用決定</span>
                          <span className="font-bold text-emerald-600">{data.hired}人</span>
                        </div>

                        {/* 採用率の可視化バー */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>採用率</span>
                            <span>{data.rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${conversionBarWidth}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 効率性の判定 */}
                        <div className="mt-3 flex items-center gap-2">
                          {parseFloat(data.rate) >= 20 ? (
                            <>
                              <i className="fas fa-trophy text-yellow-500"></i>
                              <span className="text-xs font-medium text-yellow-600">高効率チャネル</span>
                            </>
                          ) : parseFloat(data.rate) >= 10 ? (
                            <>
                              <i className="fas fa-thumbs-up text-green-500"></i>
                              <span className="text-xs font-medium text-green-600">良好</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-chart-line text-blue-500"></i>
                              <span className="text-xs font-medium text-blue-600">改善の余地あり</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 総計サマリー */}
              <div className="mt-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-calculator text-blue-500"></i>
                  総合採用サマリー
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">総応募数: </span>
                    <span className="font-bold text-slate-800">{stats.totalApplications}件</span>
                  </div>
                  <div>
                    <span className="text-slate-600">総採用数: </span>
                    <span className="font-bold text-emerald-600">{stats.hired}件</span>
                  </div>
                  <div>
                    <span className="text-slate-600">全体採用率: </span>
                    <span className="font-bold text-purple-600">{stats.hiringRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-600">選考中: </span>
                    <span className="font-bold text-amber-600">{stats.screening + stats.interview}件</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 採用経路ランキング & 詳細比較 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                <i className="fas fa-medal text-gold-500"></i>
                採用経路効率ランキング
              </h3>
              
              {/* ランキング表示 */}
              <div className="space-y-4 mb-6">
                {Object.entries(stats.channelStats)
                  .sort((a, b) => parseFloat(b[1].rate) - parseFloat(a[1].rate))
                  .map(([channel, data], index) => {
                    const getChannelName = (ch) => {
                      const names = {
                        sns_instagram: 'Instagram',
                        sns_x: 'X',
                        sns_tiktok: 'TikTok',
                        website: 'HP応募',
                        referral: 'リファラル'
                      };
                      return names[ch] || ch;
                    };

                    const getChannelIcon = (ch) => {
                      const icons = {
                        sns_instagram: 'fab fa-instagram text-pink-500',
                        sns_x: 'fab fa-x-twitter text-black',
                        sns_tiktok: 'fab fa-tiktok text-black',
                        website: 'fas fa-globe text-blue-500',
                        referral: 'fas fa-user-friends text-green-500'
                      };
                      return icons[ch] || 'fas fa-question-circle text-slate-500';
                    };

                    const getRankIcon = (rank) => {
                      if (rank === 0) return 'fas fa-crown text-yellow-500';
                      if (rank === 1) return 'fas fa-medal text-gray-400';
                      if (rank === 2) return 'fas fa-award text-amber-600';
                      return 'fas fa-circle text-slate-400';
                    };

                    const getRankBg = (rank) => {
                      if (rank === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
                      if (rank === 1) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
                      if (rank === 2) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
                      return 'bg-slate-50 border-slate-200';
                    };

                    return (
                      <div key={channel} className={`${getRankBg(index)} border rounded-xl p-4 flex items-center gap-4`}>
                        <div className="flex items-center gap-3 flex-1">
                          <i className={getRankIcon(index)}></i>
                          <span className="text-lg font-bold text-slate-600">#{index + 1}</span>
                          <i className={getChannelIcon(channel)}></i>
                          <div>
                            <span className="font-semibold text-slate-800">{getChannelName(channel)}</span>
                            <p className="text-xs text-slate-500">
                              {data.total}件応募 → {data.hired}件採用
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-600">{data.rate}%</div>
                          <div className="text-xs text-slate-500">採用率</div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* 詳細比較チャート */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-chart-bar text-blue-500"></i>
                  採用数比較チャート
                </h4>
                <div className="space-y-3">
                  {Object.entries(stats.channelStats)
                    .sort((a, b) => b[1].hired - a[1].hired)
                    .map(([channel, data]) => {
                      const getChannelName = (ch) => {
                        const names = {
                          sns_instagram: 'Instagram',
                          sns_x: 'X',
                          sns_tiktok: 'TikTok',
                          website: 'HP応募',
                          referral: 'リファラル'
                        };
                        return names[ch] || ch;
                      };

                      const maxHired = Math.max(...Object.values(stats.channelStats).map(d => d.hired));
                      const barWidth = maxHired > 0 ? (data.hired / maxHired) * 100 : 0;

                      return (
                        <div key={channel} className="flex items-center gap-3">
                          <div className="w-20 text-sm font-medium text-slate-600 text-right">
                            {getChannelName(channel)}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                            <div 
                              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                              style={{ width: `${barWidth}%` }}
                            >
                              {data.hired > 0 && (
                                <span className="text-xs font-bold text-white">{data.hired}人</span>
                              )}
                            </div>
                          </div>
                          <div className="w-12 text-sm font-bold text-slate-800 text-right">
                            {data.hired}人
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* 応募ステータス別統計 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
                <i className="fas fa-tasks text-purple-500"></i>
                応募ステータス別統計
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-slate-700">応募受付</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{stats.applied}件</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="font-medium text-slate-700">書類選考中</span>
                  </div>
                  <span className="text-xl font-bold text-amber-600">{stats.screening}件</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-slate-700">面接中</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">{stats.interview}件</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium text-slate-700">採用決定</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-600">{stats.hired}件</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-slate-700">不採用</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{stats.rejected}件</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                    <span className="font-medium text-slate-700">辞退</span>
                  </div>
                  <span className="text-xl font-bold text-slate-600">{stats.withdrawn}件</span>
                </div>
              </div>
            </div>
          </div>

          {/* 採用経路別月次トレンド */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              <i className="fas fa-chart-line text-purple-500"></i>
              採用経路別 月次トレンド分析
            </h3>
            
            {selectedMonth ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-700">
                  <i className="fas fa-info-circle"></i>
                  <span className="font-medium">
                    {generateMonths().find(m => m.value === selectedMonth)?.label} の詳細データを表示中
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMonth('')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  全期間データに戻る
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="text-slate-600">
                  <i className="fas fa-calendar-alt mr-2"></i>
                  全期間のデータを表示中（過去12ヶ月分）
                </div>
              </div>
            )}

            {/* 採用成功事例のハイライト */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(stats.channelStats)
                .filter(([channel, data]) => data.hired > 0)
                .sort((a, b) => b[1].hired - a[1].hired)
                .map(([channel, data]) => {
                  const getChannelName = (ch) => {
                    const names = {
                      sns_instagram: 'Instagram',
                      sns_x: 'X',
                      sns_tiktok: 'TikTok',
                      website: 'HP応募',
                      referral: 'リファラル'
                    };
                    return names[ch] || ch;
                  };

                  const getChannelIcon = (ch) => {
                    const icons = {
                      sns_instagram: 'fab fa-instagram text-pink-500',
                      sns_x: 'fab fa-x-twitter text-black',
                      sns_tiktok: 'fab fa-tiktok text-black',
                      website: 'fas fa-globe text-blue-500',
                      referral: 'fas fa-user-friends text-green-500'
                    };
                    return icons[ch] || 'fas fa-question-circle text-slate-500';
                  };

                  return (
                    <div key={channel} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <i className={getChannelIcon(channel)}></i>
                        <span className="font-semibold text-slate-800">{getChannelName(channel)}</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600 mb-1">{data.hired}名採用</div>
                      <div className="text-sm text-slate-600">
                        応募{data.total}名から採用率{data.rate}%で成功
                      </div>
                      {data.hired >= 3 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
                          <i className="fas fa-star"></i>
                          <span>主力採用チャネル</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* 採用なしチャネルのアラート */}
            {Object.entries(stats.channelStats).some(([channel, data]) => data.hired === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle text-amber-500"></i>
                  改善が必要な採用経路
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(stats.channelStats)
                    .filter(([channel, data]) => data.hired === 0 && data.total > 0)
                    .map(([channel, data]) => {
                      const getChannelName = (ch) => {
                        const names = {
                          sns_instagram: 'Instagram',
                          sns_x: 'X',
                          sns_tiktok: 'TikTok',
                          website: 'HP応募',
                          referral: 'リファラル'
                        };
                        return names[ch] || ch;
                      };

                      const getChannelIcon = (ch) => {
                        const icons = {
                          sns_instagram: 'fab fa-instagram text-pink-500',
                          sns_x: 'fab fa-x-twitter text-black',
                          sns_tiktok: 'fab fa-tiktok text-black',
                          website: 'fas fa-globe text-blue-500',
                          referral: 'fas fa-user-friends text-green-500'
                        };
                        return icons[ch] || 'fas fa-question-circle text-slate-500';
                      };

                      return (
                        <div key={channel} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <i className={getChannelIcon(channel)}></i>
                          <div>
                            <span className="font-medium text-slate-700">{getChannelName(channel)}</span>
                            <p className="text-sm text-amber-600">
                              {data.total}件の応募があるが採用0件
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-3 text-sm text-amber-700">
                  💡 提案: これらのチャネルの選考プロセスや投稿内容の見直しを検討してください
                </div>
              </div>
            )}

            {/* 採用ROI分析 */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <i className="fas fa-calculator text-blue-500"></i>
                採用効率分析 (ROI)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">最高効率チャネル</div>
                  <div className="font-bold text-emerald-600">
                    {Object.entries(stats.channelStats)
                      .sort((a, b) => parseFloat(b[1].rate) - parseFloat(a[1].rate))[0]?.[0]
                      ?.replace('sns_', '').toUpperCase() || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.max(...Object.values(stats.channelStats).map(d => parseFloat(d.rate)))}%
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">最多採用チャネル</div>
                  <div className="font-bold text-blue-600">
                    {Object.entries(stats.channelStats)
                      .sort((a, b) => b[1].hired - a[1].hired)[0]?.[0]
                      ?.replace('sns_', '').toUpperCase() || 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.max(...Object.values(stats.channelStats).map(d => d.hired))}名
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">応募者1人当たり採用率</div>
                  <div className="font-bold text-purple-600">
                    1/{Math.round(stats.totalApplications / Math.max(stats.hired, 1))}
                  </div>
                  <div className="text-xs text-slate-500">平均</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">採用完了率</div>
                  <div className="font-bold text-slate-600">
                    {((stats.hired / stats.totalApplications) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500">全体</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'applications' && (
        <div className="space-y-6">
          {/* 応募者一覧テーブル */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                      <i className="fas fa-users text-green-500"></i>
                      応募者一覧
                      {selectedStatus && (
                        <span className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                          {(() => {
                            const labels = {
                              applied: '応募受付',
                              screening: '書類選考中',
                              interview: '面接中',
                              hired: '採用決定',
                              rejected: '不採用',
                              withdrawn: '辞退'
                            };
                            return labels[selectedStatus] || selectedStatus;
                          })()}のみ表示中
                        </span>
                      )}
                    </h3>
                    
                    {/* プライマリアクションボタン - タイトル横に配置 */}
                    <button
                      onClick={() => setShowNewApplicantModal(true)}
                      className="px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium">
                      <i className="fas fa-plus"></i>
                      <span className="hidden sm:inline">新規応募者追加</span>
                      <span className="sm:hidden">追加</span>
                    </button>
                  </div>
                  
                  {/* 検索・フィルターバー */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="応募者名、メール、電話番号で検索..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[140px]">
                      <option value="">並び順</option>
                      <option value="date_desc">応募日（新しい順）</option>
                      <option value="date_asc">応募日（古い順）</option>
                      <option value="name_asc">名前（A-Z）</option>
                      <option value="status">ステータス別</option>
                    </select>
                  </div>
                  
                  {/* ステータス別タブ - 検索バーの下に配置 */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-filter text-slate-400"></i>
                      <span className="text-sm font-medium text-slate-600">ステータス別フィルター</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedStatus('')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          selectedStatus === '' 
                            ? 'bg-slate-800 text-white shadow-lg' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <i className="fas fa-list"></i>
                          全て
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {applications.length}
                          </span>
                        </span>
                      </button>
                      
                      {[
                        { key: 'applied', label: '応募受付', count: stats.applied, color: 'blue', icon: 'fas fa-envelope' },
                        { key: 'screening', label: '書類選考', count: stats.screening, color: 'amber', icon: 'fas fa-file-alt' },
                        { key: 'interview', label: '面接中', count: stats.interview, color: 'purple', icon: 'fas fa-video' },
                        { key: 'hired', label: '採用決定', count: stats.hired, color: 'emerald', icon: 'fas fa-check-circle' },
                        { key: 'rejected', label: '不採用', count: stats.rejected, color: 'red', icon: 'fas fa-times-circle' },
                        { key: 'withdrawn', label: '辞退', count: stats.withdrawn, color: 'slate', icon: 'fas fa-user-minus' }
                      ].map(status => (
                        <button
                          key={status.key}
                          onClick={() => setSelectedStatus(status.key)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                            selectedStatus === status.key
                              ? `bg-${status.color}-500 text-white shadow-lg`
                              : `bg-white text-${status.color}-700 hover:bg-${status.color}-50 border border-${status.color}-200 hover:border-${status.color}-300`
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <i className={status.icon}></i>
                            <span className="hidden sm:inline">{status.label}</span>
                            <span className="sm:hidden">{status.label.slice(0, 2)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              selectedStatus === status.key
                                ? 'bg-white bg-opacity-20 text-white'
                                : `bg-${status.color}-100 text-${status.color}-800`
                            }`}>
                              {status.count}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* カード型レイアウト */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {getPaginatedApplications().map((app) => {
                  
                  const getStatusBadge = (status) => {
                    const statusConfig = {
                      applied: { bg: 'bg-blue-100', text: 'text-blue-800', label: '応募受付', icon: 'fas fa-envelope' },
                      screening: { bg: 'bg-amber-100', text: 'text-amber-800', label: '書類選考中', icon: 'fas fa-file-alt' },
                      interview: { bg: 'bg-purple-100', text: 'text-purple-800', label: '面接中', icon: 'fas fa-video' },
                      hired: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '採用決定', icon: 'fas fa-check-circle' },
                      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '不採用', icon: 'fas fa-times-circle' },
                      withdrawn: { bg: 'bg-slate-100', text: 'text-slate-800', label: '辞退', icon: 'fas fa-user-minus' }
                    };
                    return statusConfig[status] || statusConfig.applied;
                  };

                  const getChannelIcon = (channel) => {
                    const icons = {
                      sns_instagram: 'fab fa-instagram text-pink-500',
                      sns_x: 'fab fa-x-twitter text-black',
                      sns_tiktok: 'fab fa-tiktok text-black',
                      website: 'fas fa-globe text-blue-500',
                      referral: 'fas fa-user-friends text-green-500'
                    };
                    return icons[channel] || 'fas fa-question-circle text-slate-500';
                  };

                  const getChannelName = (channel) => {
                    const names = {
                      sns_instagram: 'Instagram',
                      sns_x: 'X (Twitter)',
                      sns_tiktok: 'TikTok',
                      website: 'Webサイト',
                      referral: '紹介'
                    };
                    return names[channel] || channel;
                  };

                  const statusConfig = getStatusBadge(app.status);
                  const daysSinceApplication = Math.floor((new Date() - new Date(app.created_at)) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={app.id} 
                         className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 p-5 transform hover:scale-[1.02] transition-all duration-200 hover:shadow-lg animate-fadeInUp"
                         style={{ animationDelay: `${(getPaginatedApplications().indexOf(app)) * 0.05}s` }}>
                      
                      {/* ヘッダー部分 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {app.applicant_name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-lg">{app.applicant_name}</h4>
                              <p className="text-sm text-slate-500">ID: {app.id}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <i className={statusConfig.icon}></i>
                            {statusConfig.label}
                          </span>
                          <span className="text-xs text-slate-400">{daysSinceApplication}日前</span>
                        </div>
                      </div>

                      {/* 連絡先情報 */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <i className="fas fa-envelope text-slate-400 w-4"></i>
                          <span className="text-slate-600">{app.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <i className="fas fa-phone text-slate-400 w-4"></i>
                          <span className="text-slate-600">{app.phone}</span>
                        </div>
                      </div>

                      {/* 応募経路と進行状況 */}
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <i className={getChannelIcon(app.channel)}></i>
                            <span className="text-sm font-medium text-slate-700">{getChannelName(app.channel)}</span>
                          </div>
                          <span className="text-xs text-slate-500">応募経路</span>
                        </div>
                        
                        {/* 進行状況インジケーター */}
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">進行状況</span>
                            <span className="text-xs text-slate-500">
                              {(() => {
                                const steps = ['applied', 'screening', 'interview', 'hired'];
                                const currentIndex = steps.indexOf(app.status);
                                const totalSteps = app.status === 'hired' ? steps.length : 
                                                 app.status === 'rejected' || app.status === 'withdrawn' ? -1 : 
                                                 currentIndex + 1;
                                return totalSteps > 0 ? `${totalSteps}/${steps.length}` : 'プロセス外';
                              })()}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {['applied', 'screening', 'interview', 'hired'].map((step, index) => {
                              const isCompleted = (() => {
                                const steps = ['applied', 'screening', 'interview', 'hired'];
                                const currentIndex = steps.indexOf(app.status);
                                if (app.status === 'rejected' || app.status === 'withdrawn') return false;
                                return index <= currentIndex;
                              })();
                              const isCurrent = step === app.status;
                              
                              return (
                                <div
                                  key={step}
                                  className={`flex-1 h-2 rounded-full ${
                                    isCompleted 
                                      ? isCurrent 
                                        ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse' 
                                        : 'bg-green-500'
                                      : 'bg-slate-200'
                                  }`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 日付情報 */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                        <div>
                          <p className="text-slate-500 mb-1">応募日</p>
                          <p className="font-medium text-slate-700">{new Date(app.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">更新日</p>
                          <p className="font-medium text-slate-700">{new Date(app.updated_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button 
                          onClick={() => handleViewDetail(app)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                          <i className="fas fa-eye"></i>
                          詳細
                        </button>
                        <button 
                          onClick={() => handleEditApplicant(app)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
                          <i className="fas fa-edit"></i>
                          編集
                        </button>
                        <button 
                          onClick={() => handleDeleteApplicant(app.id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* ページネーション */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* 情報表示 */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-slate-700">
                    {(() => {
                      const filteredApps = getFilteredAndSortedApplications();
                      const totalCount = filteredApps.length;
                      const startIndex = (currentPage - 1) * itemsPerPage + 1;
                      const endIndex = Math.min(currentPage * itemsPerPage, totalCount);
                      
                      if (totalCount === 0) {
                        return '該当する応募者がいません';
                      }
                      
                      return `${totalCount}件中 ${startIndex}-${endIndex}件を表示`;
                    })()}
                  </p>
                  
                  {selectedStatus && (
                    <button
                      onClick={() => setSelectedStatus('')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                    >
                      <i className="fas fa-times text-xs"></i>
                      フィルタ解除
                    </button>
                  )}
                </div>

                {/* ページネーションコントロール */}
                {getTotalPages() > 1 && (
                  <div className="flex items-center gap-1">
                    {/* 前へボタン */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 transition-all duration-200"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>

                    {/* ページ番号 */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = getTotalPages();
                        const pages = [];
                        
                        // 最初のページ
                        if (totalPages > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => goToPage(1)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPage === 1
                                  ? 'bg-green-500 text-white shadow-lg'
                                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              1
                            </button>
                          );
                        }

                        // 省略記号（前）
                        if (currentPage > 3) {
                          pages.push(
                            <span key="ellipsis-start" className="px-2 py-2 text-slate-400">
                              ...
                            </span>
                          );
                        }

                        // 現在のページ周辺
                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => goToPage(i)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPage === i
                                  ? 'bg-green-500 text-white shadow-lg'
                                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        // 省略記号（後）
                        if (currentPage < totalPages - 2) {
                          pages.push(
                            <span key="ellipsis-end" className="px-2 py-2 text-slate-400">
                              ...
                            </span>
                          );
                        }

                        // 最後のページ
                        if (totalPages > 1) {
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => goToPage(totalPages)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                currentPage === totalPages
                                  ? 'bg-green-500 text-white shadow-lg'
                                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* 次へボタン */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === getTotalPages()}
                      className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 transition-all duration-200"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>

                    {/* ページジャンプ */}
                    <div className="ml-4 flex items-center gap-2">
                      <span className="text-sm text-slate-600">ページ:</span>
                      <select
                        value={currentPage}
                        onChange={(e) => goToPage(Number(e.target.value))}
                        className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                      >
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                          <option key={page} value={page}>
                            {page}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {viewMode === 'posts' && (
        <div className="space-y-6">
          {/* SNS統計サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white animate-gradient transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">総インプレッション</p>
                  <p className="text-2xl font-bold">
                    <span className="tabular-nums">{impressionsCount.toLocaleString()}</span>
                  </p>
                  <p className="text-pink-200 text-xs mt-1">全プラットフォーム</p>
                </div>
                <i className="fas fa-eye text-4xl text-pink-200 animate-pulse"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white animate-gradient transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">総エンゲージメント</p>
                  <p className="text-2xl font-bold">
                    <span className="tabular-nums">{(likesCount + commentsCount + (stats.snsStats.totalShares || 0)).toLocaleString()}</span>
                  </p>
                  <p className="text-red-200 text-xs mt-1">率: {stats.snsStats.avgEngagementRate}%</p>
                </div>
                <i className="fas fa-heart text-4xl text-red-200 animate-heartbeat"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white animate-gradient transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">総DM数</p>
                  <p className="text-2xl font-bold">
                    <span className="tabular-nums">{dmsCount}</span>
                  </p>
                  <p className="text-blue-200 text-xs mt-1">採用につながる可能性</p>
                </div>
                <i className="fas fa-envelope text-4xl text-blue-200 animate-bounce"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white animate-gradient transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">投稿数</p>
                  <p className="text-2xl font-bold">
                    <span className="tabular-nums">{postsCount}</span>
                  </p>
                  <p className="text-green-200 text-xs mt-1">
                    {selectedMonth ? '選択月' : '全期間'}
                  </p>
                </div>
                <i className="fas fa-video text-4xl text-green-200 animate-float"></i>
              </div>
            </div>
          </div>

          {/* プラットフォーム別統計 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
              <i className="fas fa-chart-bar text-purple-500"></i>
              プラットフォーム別パフォーマンス
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['tiktok', 'instagram', 'x'].map(platform => {
                const platformPosts = socialPosts.filter(post => post.platform === platform);
                const totalViews = platformPosts.reduce((sum, post) => sum + post.views_count, 0);
                const totalLikes = platformPosts.reduce((sum, post) => sum + post.likes_count, 0);
                const totalComments = platformPosts.reduce((sum, post) => sum + post.comments_count, 0);
                const totalDMs = platformPosts.reduce((sum, post) => sum + post.dm_count, 0);
                const avgEngagement = platformPosts.length > 0 ? 
                  (platformPosts.reduce((sum, post) => sum + parseFloat(post.engagement_rate), 0) / platformPosts.length).toFixed(2) : 0;

                const platformConfig = {
                  tiktok: { name: 'TikTok', icon: 'fab fa-tiktok', color: 'border-black', bg: 'bg-black' },
                  instagram: { name: 'Instagram', icon: 'fab fa-instagram', color: 'border-pink-500', bg: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                  x: { name: 'X (Twitter)', icon: 'fab fa-x-twitter', color: 'border-blue-500', bg: 'bg-blue-500' }
                };

                const config = platformConfig[platform];

                return (
                  <div key={platform} className={`border-2 ${config.color} rounded-xl p-6`}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${config.bg} text-white rounded-full text-sm font-medium mb-4`}>
                      <i className={config.icon}></i>
                      {config.name}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">投稿数</span>
                        <span className="font-bold">{platformPosts.length}件</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">総再生数</span>
                        <span className="font-bold">{totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">いいね数</span>
                        <span className="font-bold">{totalLikes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">コメント数</span>
                        <span className="font-bold">{totalComments.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">DM数</span>
                        <span className="font-bold">{totalDMs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">平均エンゲージ率</span>
                        <span className="font-bold text-green-600">{avgEngagement}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 投稿一覧 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                      <i className="fas fa-video text-purple-500"></i>
                      SNS投稿一覧
                      {selectedPlatform && (
                        <span className="ml-2 px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                          {(() => {
                            const labels = {
                              tiktok: 'TikTok',
                              instagram: 'Instagram',
                              x: 'X (Twitter)'
                            };
                            return labels[selectedPlatform] || selectedPlatform;
                          })()}のみ表示中
                        </span>
                      )}
                    </h3>
                    
                    {/* プライマリアクションボタン - タイトル横に配置 */}
                    <button
                      onClick={() => setShowNewPostModal(true)}
                      className="px-6 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium">
                      <i className="fas fa-plus"></i>
                      <span className="hidden sm:inline">新規投稿</span>
                      <span className="sm:hidden">投稿</span>
                    </button>
                  </div>
                  
                  {/* 検索・フィルターバー */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                      <input
                        type="text"
                        value={snsSearchTerm}
                        onChange={(e) => setSnsSearchTerm(e.target.value)}
                        placeholder="投稿タイトル、内容で検索..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    
                    <select 
                      value={snsSortBy}
                      onChange={(e) => setSnsSortBy(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none min-w-[140px]">
                      <option value="">並び順</option>
                      <option value="engagement_desc">エンゲージメント率（高い順）</option>
                      <option value="views_desc">再生数（多い順）</option>
                      <option value="date_desc">投稿日（新しい順）</option>
                      <option value="likes_desc">いいね数（多い順）</option>
                    </select>
                  </div>
                  
                  {/* プラットフォーム別フィルタータブ */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-filter text-slate-400"></i>
                      <span className="text-sm font-medium text-slate-600">プラットフォーム別フィルター</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setSelectedPlatform('')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          selectedPlatform === '' 
                            ? 'bg-slate-800 text-white shadow-lg' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                        }`}>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-globe"></i>
                          全て
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedPlatform === '' 
                              ? 'bg-slate-100 text-slate-800' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {socialPosts.length}
                          </span>
                        </span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedPlatform('tiktok')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          selectedPlatform === 'tiktok'
                            ? 'bg-gray-800 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                        }`}>
                        <span className="flex items-center gap-2">
                          <i className="fab fa-tiktok"></i>
                          <span className="hidden sm:inline">TikTok</span>
                          <span className="sm:hidden">TT</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedPlatform === 'tiktok'
                              ? 'bg-white bg-opacity-20 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {socialPosts.filter(p => p.platform === 'tiktok').length}
                          </span>
                        </span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedPlatform('instagram')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          selectedPlatform === 'instagram'
                            ? 'bg-pink-500 text-white shadow-lg'
                            : 'bg-white text-pink-700 hover:bg-pink-50 border border-pink-200 hover:border-pink-300'
                        }`}>
                        <span className="flex items-center gap-2">
                          <i className="fab fa-instagram"></i>
                          <span className="hidden sm:inline">Instagram</span>
                          <span className="sm:hidden">IG</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedPlatform === 'instagram'
                              ? 'bg-white bg-opacity-20 text-white'
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {socialPosts.filter(p => p.platform === 'instagram').length}
                          </span>
                        </span>
                      </button>
                      
                      <button 
                        onClick={() => setSelectedPlatform('x')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          selectedPlatform === 'x'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300'
                        }`}>
                        <span className="flex items-center gap-2">
                          <i className="fab fa-x-twitter"></i>
                          <span className="hidden sm:inline">X (Twitter)</span>
                          <span className="sm:hidden">X</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedPlatform === 'x'
                              ? 'bg-white bg-opacity-20 text-white'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {socialPosts.filter(p => p.platform === 'x').length}
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SNS投稿カード型レイアウト */}
            <div className="p-6">
              {getFilteredAndSortedPosts().length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-search text-slate-400 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-slate-700 mb-2">投稿が見つかりませんでした</h4>
                      <p className="text-slate-500">
                        {selectedPlatform ? 
                          `${(() => {
                            const labels = {
                              tiktok: 'TikTok',
                              instagram: 'Instagram', 
                              x: 'X (Twitter)'
                            };
                            return labels[selectedPlatform];
                          })()}の投稿が見つかりませんでした。` : 
                          '検索条件を変更して再度お試しください。'
                        }
                      </p>
                    </div>
                    {selectedPlatform && (
                      <button 
                        onClick={() => setSelectedPlatform('')}
                        className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                        すべての投稿を表示
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* 結果ヘッダー */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">
                        <span className="font-semibold text-purple-600">{getFilteredAndSortedPosts().length}</span> 件の投稿
                        {selectedPlatform && (
                          <span className="ml-2">
                            ({(() => {
                              const labels = {
                                tiktok: 'TikTok',
                                instagram: 'Instagram',
                                x: 'X (Twitter)'
                              };
                              return labels[selectedPlatform];
                            })()}のみ)
                          </span>
                        )}
                      </span>
                      {snsSearchTerm && (
                        <span className="text-sm text-slate-500">
                          「<span className="font-medium">{snsSearchTerm}</span>」で検索
                        </span>
                      )}
                    </div>
                    
                    {(selectedPlatform || snsSearchTerm) && (
                      <button 
                        onClick={() => {
                          setSelectedPlatform('');
                          setSnsSearchTerm('');
                          setSnsSortBy('');
                        }}
                        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <i className="fas fa-times"></i>
                        フィルターをクリア
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredAndSortedPosts().slice(0, 12).map((post) => {
                  const getPlatformIcon = (platform) => {
                    const icons = {
                      tiktok: 'fab fa-tiktok text-black',
                      instagram: 'fab fa-instagram text-pink-500',
                      x: 'fab fa-x-twitter text-blue-500'
                    };
                    return icons[platform] || 'fas fa-video text-slate-500';
                  };

                  const getPlatformName = (platform) => {
                    const names = {
                      tiktok: 'TikTok',
                      instagram: 'Instagram',
                      x: 'X'
                    };
                    return names[platform] || platform;
                  };

                  const getPlatformColor = (platform) => {
                    const colors = {
                      tiktok: 'from-black to-gray-600',
                      instagram: 'from-pink-500 to-purple-600',
                      x: 'from-blue-500 to-blue-600'
                    };
                    return colors[platform] || 'from-gray-500 to-gray-600';
                  };

                  const engagementRate = parseFloat(post.engagement_rate) || 0;
                  const daysSincePost = Math.floor((new Date() - new Date(post.date)) / (1000 * 60 * 60 * 24));
                  const isHighPerformance = engagementRate > 5;
                  const isViralPost = post.views_count > 100000;

                  return (
                    <div key={post.id} 
                         className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-fadeInUp"
                         style={{ animationDelay: `${(post.id % 12) * 0.08}s` }}>
                      
                      {/* ヘッダー */}
                      <div className={`bg-gradient-to-r ${getPlatformColor(post.platform)} p-4 text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <i className={`${getPlatformIcon(post.platform)} text-lg`}></i>
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{getPlatformName(post.platform)}</h4>
                              <p className="text-sm opacity-90">投稿ID: {post.id}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              isHighPerformance ? 'bg-green-500 bg-opacity-20 text-green-100' :
                              engagementRate > 2 ? 'bg-yellow-500 bg-opacity-20 text-yellow-100' :
                              'bg-white bg-opacity-20 text-white'
                            }`}>
                              {isViralPost && <i className="fas fa-fire"></i>}
                              {isHighPerformance && <i className="fas fa-star"></i>}
                              {engagementRate}%
                            </div>
                            <p className="text-xs opacity-75 mt-1">{daysSincePost}日前</p>
                          </div>
                        </div>
                      </div>

                      {/* コンテンツ */}
                      <div className="p-5">
                        <div className="mb-4">
                          <h5 className="font-semibold text-slate-900 mb-2 line-clamp-2">{post.title}</h5>
                          <p className="text-sm text-slate-600 line-clamp-3">{post.content}</p>
                        </div>

                        {/* パフォーマンス指標 */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <i className="fas fa-eye text-blue-500"></i>
                              <span className="text-xs font-medium text-slate-600">再生数</span>
                            </div>
                            <p className="font-bold text-slate-900">{post.views_count.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <i className="fas fa-chart-line text-purple-500"></i>
                              <span className="text-xs font-medium text-slate-600">インプレッション</span>
                            </div>
                            <p className="font-bold text-slate-900">{post.impressions_count.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* エンゲージメント */}
                        <div className="mb-4">
                          <h6 className="text-xs font-medium text-slate-600 mb-2">エンゲージメント</h6>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-1 text-red-500">
                              <i className="fas fa-heart animate-heartbeat"></i>
                              <span className="font-mono">{post.likes_count.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-500">
                              <i className="fas fa-comment"></i>
                              <span className="font-mono">{post.comments_count}</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-500">
                              <i className="fas fa-envelope"></i>
                              <span className="font-mono">{post.dm_count}</span>
                            </div>
                          </div>
                          
                          {/* エンゲージメント率のプログレスバー */}
                          <div className="mt-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-slate-500">エンゲージメント率</span>
                              <span className={`font-semibold ${
                                engagementRate > 5 ? 'text-green-600' :
                                engagementRate > 2 ? 'text-yellow-600' : 'text-slate-600'
                              }`}>{engagementRate}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  engagementRate > 5 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                  engagementRate > 2 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                  'bg-gradient-to-r from-slate-400 to-slate-600'
                                }`}
                                style={{ width: `${Math.min(engagementRate * 10, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105">
                            <i className="fas fa-external-link-alt"></i>
                            投稿を見る
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 hover:scale-105">
                            <i className="fas fa-chart-line"></i>
                            分析
                          </button>
                          <button className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200 hover:scale-105">
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 将来のAPI連携計画 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <i className="fas fa-rocket text-purple-500"></i>
              将来の連携機能計画
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fab fa-tiktok text-black"></i>
                  <span className="font-medium">TikTok API連携</span>
                </div>
                <p className="text-sm text-slate-600">リアルタイムでの投稿データ取得、自動分析機能</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fab fa-instagram text-pink-500"></i>
                  <span className="font-medium">Instagram API連携</span>
                </div>
                <p className="text-sm text-slate-600">Instagram Business API経由でのデータ連携</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-robot text-blue-500"></i>
                  <span className="font-medium">AI分析機能</span>
                </div>
                <p className="text-sm text-slate-600">投稿パフォーマンス予測、最適化提案</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規応募者追加モーダル */}
      {showNewApplicantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-user-plus text-green-500"></i>
                  新規応募者追加
                </h3>
                <button 
                  onClick={() => setShowNewApplicantModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    応募者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newApplicant.applicant_name}
                    onChange={(e) => setNewApplicant({...newApplicant, applicant_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="山田太郎"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newApplicant.email}
                    onChange={(e) => setNewApplicant({...newApplicant, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="yamada@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={newApplicant.phone}
                    onChange={(e) => setNewApplicant({...newApplicant, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="090-1234-5678"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    応募経路
                  </label>
                  <select
                    value={newApplicant.channel}
                    onChange={(e) => setNewApplicant({...newApplicant, channel: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="website">Webサイト</option>
                    <option value="sns_instagram">Instagram</option>
                    <option value="sns_x">X (Twitter)</option>
                    <option value="sns_tiktok">TikTok</option>
                    <option value="referral">紹介</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ステータス
                  </label>
                  <select
                    value={newApplicant.status}
                    onChange={(e) => setNewApplicant({...newApplicant, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="applied">応募受付</option>
                    <option value="screening">書類選考中</option>
                    <option value="interview">面接中</option>
                    <option value="hired">採用決定</option>
                    <option value="rejected">不採用</option>
                    <option value="withdrawn">辞退</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  備考・メモ
                </label>
                <textarea
                  rows="4"
                  value={newApplicant.notes}
                  onChange={(e) => setNewApplicant({...newApplicant, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="応募者に関するメモや特記事項があれば入力してください"
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewApplicantModal(false)}
                className="px-6 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                キャンセル
              </button>
              <button
                onClick={handleAddApplicant}
                disabled={!newApplicant.applicant_name || !newApplicant.email}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <i className="fas fa-plus"></i>
                応募者を追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細表示モーダル */}
      {showDetailModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-user text-blue-500"></i>
                  応募者詳細
                </h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">応募者名</label>
                    <p className="text-lg font-semibold text-slate-900">{selectedApplicant.applicant_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">メールアドレス</label>
                    <p className="text-slate-700">{selectedApplicant.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">電話番号</label>
                    <p className="text-slate-700">{selectedApplicant.phone}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">応募経路</label>
                    <div className="flex items-center gap-2">
                      <i className={(() => {
                        const icons = {
                          sns_instagram: 'fab fa-instagram text-pink-500',
                          sns_x: 'fab fa-x-twitter text-black',
                          sns_tiktok: 'fab fa-tiktok text-black',
                          website: 'fas fa-globe text-blue-500',
                          referral: 'fas fa-user-friends text-green-500'
                        };
                        return icons[selectedApplicant.channel] || 'fas fa-question-circle text-slate-500';
                      })()}></i>
                      <span className="text-slate-700">
                        {(() => {
                          const names = {
                            sns_instagram: 'Instagram',
                            sns_x: 'X (Twitter)',
                            sns_tiktok: 'TikTok',
                            website: 'Webサイト',
                            referral: '紹介'
                          };
                          return names[selectedApplicant.channel] || selectedApplicant.channel;
                        })()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">現在のステータス</label>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                      (() => {
                        const statusConfig = {
                          applied: { bg: 'bg-blue-100', text: 'text-blue-800', label: '応募受付', icon: 'fas fa-envelope' },
                          screening: { bg: 'bg-amber-100', text: 'text-amber-800', label: '書類選考中', icon: 'fas fa-file-alt' },
                          interview: { bg: 'bg-purple-100', text: 'text-purple-800', label: '面接中', icon: 'fas fa-video' },
                          hired: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '採用決定', icon: 'fas fa-check-circle' },
                          rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '不採用', icon: 'fas fa-times-circle' },
                          withdrawn: { bg: 'bg-slate-100', text: 'text-slate-800', label: '辞退', icon: 'fas fa-user-minus' }
                        };
                        const config = statusConfig[selectedApplicant.status] || statusConfig.applied;
                        return `${config.bg} ${config.text}`;
                      })()
                    }`}>
                      <i className={(() => {
                        const statusConfig = {
                          applied: 'fas fa-envelope',
                          screening: 'fas fa-file-alt',
                          interview: 'fas fa-video',
                          hired: 'fas fa-check-circle',
                          rejected: 'fas fa-times-circle',
                          withdrawn: 'fas fa-user-minus'
                        };
                        return statusConfig[selectedApplicant.status] || 'fas fa-envelope';
                      })()}></i>
                      {(() => {
                        const labels = {
                          applied: '応募受付',
                          screening: '書類選考中',
                          interview: '面接中',
                          hired: '採用決定',
                          rejected: '不採用',
                          withdrawn: '辞退'
                        };
                        return labels[selectedApplicant.status] || selectedApplicant.status;
                      })()}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">応募日</label>
                    <p className="text-slate-700">{new Date(selectedApplicant.created_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">最終更新日</label>
                    <p className="text-slate-700">{new Date(selectedApplicant.updated_at).toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
              </div>
              
              {selectedApplicant.notes && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-500 mb-2">備考・メモ</label>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedApplicant.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                閉じる
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEditApplicant(selectedApplicant);
                }}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                <i className="fas fa-edit"></i>
                編集する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-edit text-green-500"></i>
                  応募者情報編集
                </h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    応募者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newApplicant.applicant_name}
                    onChange={(e) => setNewApplicant({...newApplicant, applicant_name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newApplicant.email}
                    onChange={(e) => setNewApplicant({...newApplicant, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={newApplicant.phone}
                    onChange={(e) => setNewApplicant({...newApplicant, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    応募経路
                  </label>
                  <select
                    value={newApplicant.channel}
                    onChange={(e) => setNewApplicant({...newApplicant, channel: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="website">Webサイト</option>
                    <option value="sns_instagram">Instagram</option>
                    <option value="sns_x">X (Twitter)</option>
                    <option value="sns_tiktok">TikTok</option>
                    <option value="referral">紹介</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ステータス
                  </label>
                  <select
                    value={newApplicant.status}
                    onChange={(e) => setNewApplicant({...newApplicant, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="applied">応募受付</option>
                    <option value="screening">書類選考中</option>
                    <option value="interview">面接中</option>
                    <option value="hired">採用決定</option>
                    <option value="rejected">不採用</option>
                    <option value="withdrawn">辞退</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  備考・メモ
                </label>
                <textarea
                  rows="4"
                  value={newApplicant.notes}
                  onChange={(e) => setNewApplicant({...newApplicant, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="応募者に関するメモや特記事項があれば入力してください"
                ></textarea>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                キャンセル
              </button>
              <button
                onClick={handleUpdateApplicant}
                disabled={!newApplicant.applicant_name || !newApplicant.email}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <i className="fas fa-save"></i>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規SNS投稿モーダル */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeInUp">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-plus-circle text-purple-500"></i>
                  新規SNS投稿作成
                </h3>
                <button 
                  onClick={() => setShowNewPostModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <i className="fas fa-times text-slate-400 hover:text-slate-600"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* プラットフォーム選択 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  投稿プラットフォーム <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setNewPost({...newPost, platform: 'tiktok'})}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                      newPost.platform === 'tiktok' 
                        ? 'border-gray-400 bg-gray-50' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}>
                    <i className="fab fa-tiktok text-2xl text-black mb-2"></i>
                    <span className="font-medium text-gray-700">TikTok</span>
                    <span className="text-xs text-gray-500">
                      {newPost.platform === 'tiktok' ? '選択中' : 'ショート動画'}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => setNewPost({...newPost, platform: 'instagram'})}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                      newPost.platform === 'instagram' 
                        ? 'border-pink-400 bg-pink-50' 
                        : 'border-pink-300 hover:border-pink-400 hover:bg-pink-50'
                    }`}>
                    <i className="fab fa-instagram text-2xl text-pink-500 mb-2"></i>
                    <span className="font-medium text-pink-700">Instagram</span>
                    <span className="text-xs text-pink-600">
                      {newPost.platform === 'instagram' ? '選択中' : '写真・動画'}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => setNewPost({...newPost, platform: 'x'})}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                      newPost.platform === 'x' 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                    <i className="fab fa-x-twitter text-2xl text-blue-500 mb-2"></i>
                    <span className="font-medium text-blue-700">X (Twitter)</span>
                    <span className="text-xs text-blue-500">
                      {newPost.platform === 'x' ? '選択中' : 'テキスト投稿'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 投稿内容 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    投稿タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="魅力的なタイトルを入力"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    投稿日時
                  </label>
                  <input
                    type="datetime-local"
                    value={newPost.date}
                    onChange={(e) => setNewPost({...newPost, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  投稿内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="5"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="投稿内容を入力してください。ハッシュタグも含めて記載できます。&#10;&#10;例：&#10;新卒エンジニア募集中！🚀&#10;弊社では最新技術を学べる環境が整っています。&#10;#エンジニア募集 #新卒採用 #tech #startup"
                ></textarea>
              </div>

              {/* メディアアップロード */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  メディアファイル
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-cloud-upload-alt text-slate-400 text-xl"></i>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium">画像・動画をアップロード</p>
                      <p className="text-sm text-slate-500">
                        PNG, JPG, MP4 ファイルをドラッグ&ドロップまたはクリックして選択
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                      ファイルを選択
                    </button>
                  </div>
                </div>
              </div>

              {/* ターゲット設定 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ターゲット属性
                  </label>
                  <select 
                    value={newPost.target_audience}
                    onChange={(e) => setNewPost({...newPost, target_audience: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <option value="">選択してください</option>
                    <option value="students">大学生・専門学校生</option>
                    <option value="fresh_graduates">新卒予定者</option>
                    <option value="career_change">転職希望者</option>
                    <option value="experienced">経験者</option>
                    <option value="general">一般（幅広い層）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    予想エンゲージメント
                  </label>
                  <select 
                    value={newPost.expected_engagement}
                    onChange={(e) => setNewPost({...newPost, expected_engagement: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <option value="">予想を選択</option>
                    <option value="low">低（1-3%）</option>
                    <option value="medium">中（3-7%）</option>
                    <option value="high">高（7-15%）</option>
                    <option value="viral">バイラル（15%+）</option>
                  </select>
                </div>
              </div>

              {/* ハッシュタグ提案 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  推奨ハッシュタグ
                </label>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {['#エンジニア募集', '#新卒採用', '#tech', '#startup', '#プログラマー', '#IT企業', '#成長企業', '#新卒歓迎', '#未経験歓迎', '#リモートワーク'].map((tag, index) => (
                      <button 
                        key={index}
                        onClick={() => {
                          const currentContent = newPost.content;
                          const newContent = currentContent + (currentContent ? ' ' : '') + tag;
                          setNewPost({...newPost, content: newContent});
                        }}
                        className="px-3 py-1 bg-white text-purple-700 text-sm rounded-full border border-purple-200 hover:bg-purple-100 transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    <i className="fas fa-lightbulb"></i>
                    クリックで投稿内容に追加できます
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewPostModal(false)}
                className="px-6 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                キャンセル
              </button>
              <button
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                <i className="fas fa-clock"></i>
                下書き保存
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.title || !newPost.content}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="fas fa-paper-plane"></i>
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// カスタムアニメーション用CSS（グローバルに適用される）
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-3deg); }
      75% { transform: rotate(3deg); }
    }

    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-fadeInUp {
      animation: fadeInUp 0.6s ease-out forwards;
    }

    .animate-slideInLeft {
      animation: slideInLeft 0.6s ease-out forwards;
    }

    .animate-slideInRight {
      animation: slideInRight 0.6s ease-out forwards;
    }

    .animate-heartbeat {
      animation: heartbeat 2s ease-in-out infinite;
    }

    .animate-wiggle {
      animation: wiggle 2s ease-in-out infinite;
    }

    .animate-spin-slow {
      animation: spin-slow 3s linear infinite;
    }

    .animate-float {
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    /* ホバーエフェクト */
    .hover-lift {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hover-lift:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    /* グラデーションアニメーション */
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .animate-gradient {
      background-size: 200% 200%;
      animation: gradient 3s ease infinite;
    }
  `;
  
  if (!document.head.querySelector('style[data-recruitment-animations]')) {
    style.setAttribute('data-recruitment-animations', 'true');
    document.head.appendChild(style);
  }
}