import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
type MessageStatus = 'DRAFT' | 'SENT';

type User = {
  id: number;
  name: string;
  email: string;
  studentNumber?: string | null;
  role: UserRole;
  grade?: number | null;
  department?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ReadStatus = {
  id: number;
  messageId: number;
  userId: number;
  readAt: string;
};

type Message = {
  id: number;
  title: string;
  body: string;
  status: MessageStatus;
  targetRole?: UserRole | null;
  targetGrade?: number | null;
  targetDepartment?: string | null;
  createdAt: string;
  updatedAt: string;
  readStatuses?: ReadStatus[];
  survey?: { question: string } | null;
};

type ReadStatusDetailUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  grade?: number | null;
  department?: string | null;
  readAt?: string;
};

type ReadStatusDetail = {
  message: {
    id: number;
    title: string;
    status: MessageStatus;
    targetRole?: UserRole | null;
    targetGrade?: number | null;
    targetDepartment?: string | null;
    createdAt: string;
  };
  readCount: number;
  unreadCount: number;
  readUsers: ReadStatusDetailUser[];
  unreadUsers: ReadStatusDetailUser[];
};

type SurveyStatusUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  grade?: number | null;
  department?: string | null;
  answeredAt?: string;
};

type SurveyStatusSummaryItem = {
  choiceId: number;
  label: string;
  count: number;
  users: SurveyStatusUser[];
};

type SurveyStatusDetail = {
  message: {
    id: number;
    title: string;
    status: MessageStatus;
  };
  survey: {
    id: number;
    question: string;
  };
  targetCount: number;
  totalAnswerCount: number;
  unansweredCount: number;
  summary: SurveyStatusSummaryItem[];
  unansweredUsers: SurveyStatusUser[];
};

const roleLabels: Record<UserRole, string> = {
  STUDENT: '生徒',
  PARENT: '保護者',
  TEACHER: '教員',
  STAFF: '事務',
  ADMIN: '管理者',
};

const messageStatusLabels: Record<MessageStatus, string> = {
  DRAFT: '下書き',
  SENT: '送信済み',
};

const departmentOptions = [
  { value: '', label: '未指定 / 全所属' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
  { value: 'Civil Engineering', label: 'Civil Engineering' },
  { value: 'Architecture', label: 'Architecture' },
] as const;

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [userGrade, setUserGrade] = useState('');
  const [department, setDepartment] = useState('');

  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | ''>('');
  const [targetGrade, setTargetGrade] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [surveyQuestion, setSurveyQuestion] = useState('');
  const [surveyChoicesText, setSurveyChoicesText] = useState('');

  const [messageSearch, setMessageSearch] = useState('');
  const [messageStatusFilter, setMessageStatusFilter] = useState<MessageStatus | 'ALL'>('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [userActiveFilter, setUserActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingReadStatus, setLoadingReadStatus] = useState(false);
  const [readStatusDetail, setReadStatusDetail] = useState<ReadStatusDetail | null>(null);
  const [loadingSurveyStatus, setLoadingSurveyStatus] = useState(false);
  const [surveyStatusDetail, setSurveyStatusDetail] = useState<SurveyStatusDetail | null>(null);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const activeCount = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users],
  );

  const roleCounts = useMemo(() => {
    return users.reduce<Record<UserRole, number>>(
      (counts, user) => {
        counts[user.role] += 1;
        return counts;
      },
      {
        STUDENT: 0,
        PARENT: 0,
        TEACHER: 0,
        STAFF: 0,
        ADMIN: 0,
      },
    );
  }, [users]);

  // ▼ 追加: 未定義エラーを解消するためのフィルタリングロジック
  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchSearch = message.title.includes(messageSearch) || message.body.includes(messageSearch);
      const matchStatus = messageStatusFilter === 'ALL' || message.status === messageStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [messages, messageSearch, messageStatusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.name.includes(userSearch) ||
        user.email.includes(userSearch) ||
        (user.department || '').includes(userSearch);
      const matchRole = userRoleFilter === 'ALL' || user.role === userRoleFilter;
      const matchActive =
        userActiveFilter === 'ALL' ||
        (userActiveFilter === 'ACTIVE' && user.isActive) ||
        (userActiveFilter === 'INACTIVE' && !user.isActive);
      return matchSearch && matchRole && matchActive;
    });
  }, [users, userSearch, userRoleFilter, userActiveFilter]);
  // ▲ 追加ここまで

  async function fetchUsers() {
    setLoadingUsers(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/users');

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchMessages() {
    setLoadingMessages(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/messages');

      if (!response.ok) {
        throw new Error('連絡一覧の取得に失敗しました');
      }

      const data: Message[] = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, []);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setNotice('');
    setError('');

    try {
      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          studentNumber: studentNumber || undefined,
          loginPassword: loginPassword || undefined,
          role,
          grade: userGrade ? Number(userGrade) : undefined,
          department: department || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(' / ')
          : typeof errorData.message === 'string'
            ? errorData.message
            : 'ユーザーの作成に失敗しました';

        throw new Error(errorMessage);
      }

      setName('');
      setEmail('');
      setStudentNumber('');
      setLoginPassword('');
      setRole('STUDENT');
      setUserGrade('');
      setDepartment('');
      setNotice('ユーザーを追加しました');

      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  async function handleEditUser(user: User) {
    const nextName = window.prompt('名前を編集', user.name);
    if (nextName === null) {
      return;
    }

    const nextEmail = window.prompt('メールアドレスを編集', user.email);
    if (nextEmail === null) {
      return;
    }

    const nextGrade = window.prompt('学年を編集（1〜5、空欄で未指定）', user.grade ? String(user.grade) : '');
    if (nextGrade === null) {
      return;
    }

    const nextDepartment = window.prompt('所属を編集（空欄で未指定）', user.department ?? '');
    if (nextDepartment === null) {
      return;
    }

    setNotice('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nextName,
          email: nextEmail,
          grade: nextGrade ? Number(nextGrade) : null,
          department: nextDepartment || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          typeof errorData.message === 'string'
            ? errorData.message
            : Array.isArray(errorData.message)
              ? errorData.message.join(' / ')
              : 'ユーザーの編集に失敗しました';

        throw new Error(errorMessage);
      }

      setNotice('ユーザー情報を編集しました');
      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }
  async function handleDeleteUser(user: User) {
    const ok = window.confirm(`${user.name} を無効化しますか？`);

    if (!ok) {
      return;
    }

    setNotice('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('ユーザーの無効化に失敗しました');
      }

      setNotice('ユーザーを無効化しました');
      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  async function handleActivateUser(user: User) {
    const ok = window.confirm(`${user.name} を有効化しますか？`);

    if (!ok) {
      return;
    }

    setNotice('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/users/${user.id}/activate`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('ユーザーの有効化に失敗しました');
      }

      setNotice('ユーザーを有効化しました');
      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  async function handleCreateMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setNotice('');
    setError('');

    try {
      const response = await fetch('http://localhost:3000/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: messageTitle,
          body: messageBody,
          targetRole: targetRole || undefined,
          targetGrade: targetGrade ? Number(targetGrade) : undefined,
          targetDepartment: targetDepartment || undefined,
          surveyQuestion: surveyQuestion || undefined,
          surveyChoices: surveyChoicesText
            ? surveyChoicesText
                .split("\n")
                .map((choice) => choice.trim())
                .filter((choice) => choice.length > 0)
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(' / ')
          : typeof errorData.message === 'string'
            ? errorData.message
            : '連絡の作成に失敗しました';

        throw new Error(errorMessage);
      }

      setMessageTitle('');
      setMessageBody('');
      setTargetRole('');
      setTargetGrade('');
      setTargetDepartment('');
      setSurveyQuestion('');
      setSurveyChoicesText('');
      setNotice('連絡を作成しました');

      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  async function handleEditDraftMessage(message: Message) {
    if (message.status !== 'DRAFT') {
      setError('送信済みの連絡は編集できません');
      return;
    }

    const nextTitle = window.prompt('タイトルを編集', message.title);
    if (nextTitle === null) {
      return;
    }

    const nextBody = window.prompt('本文を編集', message.body);
    if (nextBody === null) {
      return;
    }

    setNotice('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: nextTitle,
          body: nextBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          typeof errorData.message === 'string'
            ? errorData.message
            : '連絡の編集に失敗しました';

        throw new Error(errorMessage);
      }

      setNotice('下書き連絡を編集しました');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }
  async function handleSendMessage(message: Message) {
    const ok = window.confirm(`${message.title} を送信済みにしますか？`);

    if (!ok) {
      return;
    }

    setNotice('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/send`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('連絡の送信処理に失敗しました');
      }

      setNotice('連絡を送信済みにしました');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  async function handleShowReadStatus(message: Message) {
    setNotice('');
    setError('');
    setLoadingReadStatus(true);

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/read-status`);

      if (!response.ok) {
        throw new Error('既読状況の取得に失敗しました');
      }

      const data: ReadStatusDetail = await response.json();
      setReadStatusDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoadingReadStatus(false);
    }
  }


  async function handleShowSurveyStatus(message: Message) {
    setNotice("");
    setError("");
    setLoadingSurveyStatus(true);

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/survey-status`);

      if (!response.ok) {
        throw new Error("Failed to load survey status.");
      }

      const data: SurveyStatusDetail = await response.json();
      setSurveyStatusDetail(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setLoadingSurveyStatus(false);
    }
  }

  async function handleDeleteMessage(message: Message) {
    const ok = window.confirm(`${message.title} を削除しますか？`);

    if (!ok) {
      return;
    }

    setNotice('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('連絡の削除に失敗しました');
      }

      if (readStatusDetail?.message.id === message.id) {
        setReadStatusDetail(null);
      }

      setNotice('連絡を削除しました');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  function getTargetUsers(message: Message) {
    return users.filter((user) => {
      if (!user.isActive) {
        return false;
      }

      if (message.targetRole && user.role !== message.targetRole) {
        return false;
      }

      if (message.targetGrade && user.grade !== message.targetGrade) {
        return false;
      }

      if (message.targetDepartment && user.department !== message.targetDepartment) {
        return false;
      }

      return true;
    });
  }

  function getReadCount(message: Message) {
    const targetUsers = getTargetUsers(message);
    const targetUserIds = new Set(targetUsers.map((user) => user.id));

    return (message.readStatuses ?? []).filter((readStatus) =>
      targetUserIds.has(readStatus.userId),
    ).length;
  }

  function getTargetLabel(message: Message | ReadStatusDetail['message']) {
    const roleText = message.targetRole ? roleLabels[message.targetRole] : '全員';
    const gradeText = message.targetGrade ? `${message.targetGrade}年` : '全学年';
    const departmentText = message.targetDepartment || '全所属';

    return `${roleText} / ${gradeText} / ${departmentText}`;
  }

  function formatUserInfo(user: ReadStatusDetailUser) {
    const gradeText = user.grade ? `${user.grade}年` : '学年未指定';
    const departmentText = user.department || '所属未指定';

    return `${roleLabels[user.role]} / ${gradeText} / ${departmentText}`;
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Akashi Contact App</p>
          <h1>学校連絡アプリ 管理画面</h1>
          <p className="header-text">
            ユーザー管理と学校連絡の作成を行います。
          </p>
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">登録ユーザー</span>
          <strong>{users.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">有効ユーザー</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">生徒</span>
          <strong>{roleCounts.STUDENT}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">作成済み連絡</span>
          <strong>{messages.length}</strong>
        </div>
      </section>

      {notice && <p className="global-success">{notice}</p>}
      {error && <p className="global-error">{error}</p>}

      {(loadingSurveyStatus || surveyStatusDetail) && (
        <section className="card survey-detail-panel">
          <div className="section-heading">
            <div>
              <h2>{"\u30a2\u30f3\u30b1\u30fc\u30c8\u96c6\u8a08"}</h2>
              <p>
                {surveyStatusDetail
                  ? `\u9023\u7d61\u300c${surveyStatusDetail.message.title}\u300d\u306e\u96c6\u8a08\u7d50\u679c\u3067\u3059\u3002`
                  : "\u30a2\u30f3\u30b1\u30fc\u30c8\u96c6\u8a08\u3092\u8aad\u307f\u8fbc\u3093\u3067\u3044\u307e\u3059\u3002"}
              </p>
            </div>

            {surveyStatusDetail && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSurveyStatusDetail(null)}
              >
                {"\u9589\u3058\u308b"}
              </button>
            )}
          </div>

          {loadingSurveyStatus && <p className="muted">{"\u8aad\u307f\u8fbc\u307f\u4e2d..."}</p>}

          {surveyStatusDetail && !loadingSurveyStatus && (
            <>
              <div className="survey-detail-summary">
                <div>
                  <span>{"\u8cea\u554f"}</span>
                  <strong>{surveyStatusDetail.survey.question}</strong>
                </div>
                <div>
                  <span>{"\u5bfe\u8c61\u8005"}</span>
                  <strong>{surveyStatusDetail.targetCount}</strong>
                </div>
                <div>
                  <span>{"\u56de\u7b54\u6570"}</span>
                  <strong>{surveyStatusDetail.totalAnswerCount}</strong>
                </div>
                <div>
                  <span>{"\u672a\u56de\u7b54"}</span>
                  <strong>{surveyStatusDetail.unansweredCount}</strong>
                </div>
              </div>

              <div className="survey-result-list">
                {surveyStatusDetail.summary.map((item) => (
                  <section className="survey-result-card" key={item.choiceId}>
                    <div className="survey-result-head">
                      <h3>{item.label}</h3>
                      <strong>{item.count}{"\u4ef6"}</strong>
                    </div>

                    {item.users.length > 0 ? (
                      <ul>
                        {item.users.map((user) => (
                          <li key={`${item.choiceId}-${user.id}`}>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                            <small>
                              {roleLabels[user.role]} / {user.grade ? `${user.grade}\u5e74` : "\u5b66\u5e74\u672a\u6307\u5b9a"} / {user.department || "\u6240\u5c5e\u672a\u6307\u5b9a"}
                            </small>
                            {user.answeredAt && (
                              <small>
                                {"\u56de\u7b54\u65e5\u6642"}: {new Date(user.answeredAt).toLocaleString("ja-JP")}
                              </small>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">{"\u3053\u306e\u9078\u629e\u80a2\u3078\u306e\u56de\u7b54\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002"}</p>
                    )}
                  </section>
                ))}

              <section className="survey-unanswered-card">
                <div className="survey-result-head">
                  <h3>{"\u672a\u56de\u7b54\u8005"}</h3>
                  <strong>{surveyStatusDetail.unansweredCount}{"\u4eba"}</strong>
                </div>

                {surveyStatusDetail.unansweredUsers.length > 0 ? (
                  <ul>
                    {surveyStatusDetail.unansweredUsers.map((user) => (
                      <li key={`unanswered-${user.id}`}>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                        <small>
                          {roleLabels[user.role]} / {user.grade ? `${user.grade}\u5e74` : "\u5b66\u5e74\u672a\u6307\u5b9a"} / {user.department || "\u6240\u5c5e\u672a\u6307\u5b9a"}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="all-read-message">{"\u5168\u54e1\u304c\u56de\u7b54\u6e08\u307f\u3067\u3059\u3002"}</p>
                )}
              </section>

              </div>
            </>
          )}
        </section>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>連絡作成</h2>
            <p>学校から配信する連絡のタイトル、本文、宛先条件を作成します。</p>
          </div>
        </div>

        {/* ▼ 追加: 欠落していた連絡作成フォーム */}
        <form className="message-form" onSubmit={handleCreateMessage}>
          <label>
            タイトル
            <input
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              required
            />
          </label>
          <label>
            本文
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={5}
              required
            />
          </label>
          
          <div className="target-grid">
            <label>
              宛先権限
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value as UserRole | '')}>
                <option value="">全員</option>
                <option value="STUDENT">{roleLabels.STUDENT}</option>
                <option value="PARENT">{roleLabels.PARENT}</option>
                <option value="TEACHER">{roleLabels.TEACHER}</option>
                <option value="STAFF">{roleLabels.STAFF}</option>
                <option value="ADMIN">{roleLabels.ADMIN}</option>
              </select>
            </label>

            <label>
              宛先学年
              <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)}>
                <option value="">全学年</option>
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
              </select>
            </label>

            <label>
              宛先所属
              <select value={targetDepartment} onChange={(e) => setTargetDepartment(e.target.value)}>
                {departmentOptions.map((option) => (
                  <option key={`msg-dept-${option.value || 'none'}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="survey-form-box">
            <label>
              {"\u30a2\u30f3\u30b1\u30fc\u30c8\u8cea\u554f\uff08\u4efb\u610f\uff09"}
              <input
                value={surveyQuestion}
                onChange={(event) => setSurveyQuestion(event.target.value)}
                placeholder={"\u4f8b\uff1a\u6587\u5316\u796d\u306b\u53c2\u52a0\u3067\u304d\u307e\u3059\u304b\uff1f"}
              />
            </label>

            <label>
              {"\u9078\u629e\u80a2\uff081\u884c\u306b1\u3064\u30012\u3064\u4ee5\u4e0a\uff09"}
              <textarea
                value={surveyChoicesText}
                onChange={(event) => setSurveyChoicesText(event.target.value)}
                placeholder={"\u53c2\u52a0\n\u4e0d\u53c2\u52a0\n\u672a\u5b9a"}
                rows={4}
              />
            </label>
          </div>

          <button type="submit" className="primary-button">
            作成
          </button>
        </form>
        {/* ▲ 追加ここまで */}
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>連絡一覧</h2>
            <p>作成済みの学校連絡を表示します。</p>
          </div>
          <button type="button" className="secondary-button" onClick={fetchMessages}>
            再読み込み
          </button>
        </div>

        <div className="message-filter-bar">
          <label>
            検索
            <input
              value={messageSearch}
              onChange={(event) => setMessageSearch(event.target.value)}
              placeholder="タイトル・本文で検索"
            />
          </label>

          <label>
            状態
            <select
              value={messageStatusFilter}
              onChange={(event) => setMessageStatusFilter(event.target.value as MessageStatus | 'ALL')}
            >
              <option value="ALL">すべて</option>
              <option value="DRAFT">{messageStatusLabels.DRAFT}</option>
              <option value="SENT">{messageStatusLabels.SENT}</option>
            </select>
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setMessageSearch('');
              setMessageStatusFilter('ALL');
            }}
          >
            条件クリア
          </button>

          <p>
            表示: {filteredMessages.length} / {messages.length}
          </p>
        </div>

        {loadingMessages && <p className="muted">読み込み中...</p>}

        {!loadingMessages && (
          <div className="message-list">
            {filteredMessages.map((message) => {
              const targetCount = getTargetUsers(message).length;
              const readCount = getReadCount(message);
              const unreadCount = Math.max(targetCount - readCount, 0);

              return (
                <article className="message-item" key={message.id}>
                  <div>
                    <span className={`status-badge status-${message.status.toLowerCase()}`}>
                      {messageStatusLabels[message.status]}
                    </span>
                    <h3>{message.title}</h3>
                    <p>{message.body}</p>

                    <p className="target-role-label">
                      宛先: {getTargetLabel(message)}
                    </p>
                    {message.survey && (
  <p className="survey-badge">
    アンケートあり: {message.survey.question}
  </p>
)}

                    <div className="read-summary">
                      <span>対象: {targetCount}</span>
                      <span>既読: {readCount}</span>
                      <span>未読: {message.status === 'SENT' ? unreadCount : '-'}</span>
                    </div>
                  </div>

                  <div className="message-actions">
                    <time>{new Date(message.createdAt).toLocaleString('ja-JP')}</time>

                    <button
                      type="button"
                      className="read-status-button"
                      onClick={() => handleShowReadStatus(message)}
                    >
                      既読状況
                    </button>

                    {message.survey && (
                      <button
                        type="button"
                        className="survey-status-button"
                        onClick={() => handleShowSurveyStatus(message)}
                      >
                        {"\u30a2\u30f3\u30b1\u30fc\u30c8\u96c6\u8a08"}
                      </button>
                    )}

                    {message.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditDraftMessage(message)}
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          className="send-button"
                          onClick={() => handleSendMessage(message)}
                        >
                          送信
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteMessage(message)}
                    >
                      削除
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredMessages.length === 0 && (
              <p className="muted">条件に一致する連絡はありません。</p>
            )}
          </div>
        )}
      </section>

      {(loadingReadStatus || readStatusDetail) && (
        <section className="card read-detail-panel">
          <div className="section-heading">
            <div>
              <h2>既読状況</h2>
              <p>
                {readStatusDetail
                  ? `連絡「${readStatusDetail.message.title}」の確認状況です。`
                  : '既読状況を読み込んでいます。'}
              </p>
            </div>

            {readStatusDetail && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setReadStatusDetail(null)}
              >
                閉じる
              </button>
            )}
          </div>

          {loadingReadStatus && <p className="muted">読み込み中...</p>}

          {readStatusDetail && !loadingReadStatus && (
            <>
              <div className="read-detail-summary">
                <div>
                  <span>宛先条件</span>
                  <strong>{getTargetLabel(readStatusDetail.message)}</strong>
                </div>
                <div>
                  <span>既読</span>
                  <strong>{readStatusDetail.readCount}</strong>
                </div>
                <div>
                  <span>未読</span>
                  <strong>{readStatusDetail.unreadCount}</strong>
                </div>
              </div>

              <div className="read-detail-columns">
                <section>
                  <h3>既読者</h3>

                  {readStatusDetail.readUsers.length > 0 ? (
                    <ul className="read-user-list">
                      {readStatusDetail.readUsers.map((user) => (
                        <li key={`read-${user.id}`}>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                          <small>{formatUserInfo(user)}</small>
                          {user.readAt && (
                            <small>
                              確認日時: {new Date(user.readAt).toLocaleString('ja-JP')}
                            </small>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">まだ誰も確認していません。</p>
                  )}
                </section>

                <section>
                  <h3>未読者</h3>

                  {readStatusDetail.unreadUsers.length > 0 ? (
                    <ul className="read-user-list unread">
                      {readStatusDetail.unreadUsers.map((user) => (
                        <li key={`unread-${user.id}`}>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                          <small>{formatUserInfo(user)}</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="all-read-message">全員が確認済みです。</p>
                  )}
                </section>
              </div>
            </>
          )}
        </section>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>ユーザー追加</h2>
            <p>名前、メールアドレス、学籍番号、パスワード、権限、学年、所属を入力してユーザーを登録します。</p>
          </div>
        </div>

        <form className="form" onSubmit={handleCreateUser}>
          <label>
            名前
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例：山田 太郎"
            />
          </label>

          <label>
            メールアドレス
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
            />
          </label>

          <label>
            学籍番号
            <input
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value.toUpperCase())}
              placeholder="例：E2211"
              pattern="[MECA][0-9]{4}"
              title="学籍番号は M/E/C/A のいずれか1文字 + 4桁の数字で入力してください"
            />
          </label>

          <label>
            パスワード
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="例：pass1234"
              minLength={4}
            />
          </label>

          <label>
            権限
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="STUDENT">{roleLabels.STUDENT}</option>
              <option value="PARENT">{roleLabels.PARENT}</option>
              <option value="TEACHER">{roleLabels.TEACHER}</option>
              <option value="STAFF">{roleLabels.STAFF}</option>
              <option value="ADMIN">{roleLabels.ADMIN}</option>
            </select>
          </label>

          <label>
            学年
            <select
              value={userGrade}
              onChange={(event) => setUserGrade(event.target.value)}
            >
              <option value="">未指定</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>

          <label>
            所属
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              {departmentOptions.map((option) => (
                <option key={`user-${option.value || 'none'}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="primary-button">
            追加
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>ユーザー一覧</h2>
            <p>現在登録されているユーザーを表示します。</p>
          </div>
          <button type="button" className="secondary-button" onClick={fetchUsers}>
            再読み込み
          </button>
        </div>

        <div className="user-filter-bar">
          <label>
            検索
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="名前・メール・学籍番号・所属で検索"
            />
          </label>

          <label>
            権限
            <select
              value={userRoleFilter}
              onChange={(event) => setUserRoleFilter(event.target.value as UserRole | 'ALL')}
            >
              <option value="ALL">すべて</option>
              <option value="STUDENT">{roleLabels.STUDENT}</option>
              <option value="PARENT">{roleLabels.PARENT}</option>
              <option value="TEACHER">{roleLabels.TEACHER}</option>
              <option value="STAFF">{roleLabels.STAFF}</option>
              <option value="ADMIN">{roleLabels.ADMIN}</option>
            </select>
          </label>

          <label>
            状態
            <select
              value={userActiveFilter}
              onChange={(event) => setUserActiveFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            >
              <option value="ALL">すべて</option>
              <option value="ACTIVE">有効</option>
              <option value="INACTIVE">無効</option>
            </select>
          </label>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setUserSearch('');
              setUserRoleFilter('ALL');
              setUserActiveFilter('ALL');
            }}
          >
            条件クリア
          </button>

          <p>
            表示: {filteredUsers.length} / {users.length}
          </p>
        </div>

        {loadingUsers && <p className="muted">読み込み中...</p>}

        {!loadingUsers && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名前</th>
                  <th>メールアドレス</th>
                  <th>学籍番号</th>
                  <th>権限</th>
                  <th>学年</th>
                  <th>所属</th>
                  <th>状態</th>
                  <th>作成日時</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td className="name-cell">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.studentNumber || '-'}</td>
                    <td>
                      <span className={`role-badge role-${user.role.toLowerCase()}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td>{user.grade ?? '-'}</td>
                    <td>{user.department || '-'}</td>
                    <td>{user.isActive ? '有効' : '無効'}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <div className="user-action-buttons">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditUser(user)}
                        >
                          編集
                        </button>

                        {user.isActive ? (
                          <button
                            type="button"
                            className="deactivate-button"
                            onClick={() => handleDeleteUser(user)}
                          >
                            無効化
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="activate-button"
                            onClick={() => handleActivateUser(user)}
                          >
                            有効化
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <p className="muted user-empty-message">
                条件に一致するユーザーはいません。
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminPage;