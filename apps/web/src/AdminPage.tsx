import { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';

type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
type MessageStatus = 'DRAFT' | 'SENT';

type User = {
  id: number;
  name: string;
  email: string;
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

const roleLabels: Record<UserRole, string> = {
  STUDENT: '\u751f\u5f92',
  PARENT: '\u4fdd\u8b77\u8005',
  TEACHER: '\u6559\u54e1',
  STAFF: '\u4e8b\u52d9',
  ADMIN: '\u7ba1\u7406\u8005',
};

const messageStatusLabels: Record<MessageStatus, string> = {
  DRAFT: '\u4e0b\u66f8\u304d',
  SENT: '\u9001\u4fe1\u6e08\u307f',
};

const departmentOptions = [
  { value: '', label: '\u672a\u6307\u5b9a / \u5168\u6240\u5c5e' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
  { value: 'Civil Engineering', label: 'Civil Engineering' },
  { value: 'Architecture', label: 'Architecture' },
  { value: 'Applied Chemistry', label: 'Applied Chemistry' },
] as const;

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [userGrade, setUserGrade] = useState('');
  const [department, setDepartment] = useState('');

  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | ''>('');
  const [targetGrade, setTargetGrade] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');

  const [messageSearch, setMessageSearch] = useState('');
  const [messageStatusFilter, setMessageStatusFilter] = useState<MessageStatus | 'ALL'>('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [userActiveFilter, setUserActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingReadStatus, setLoadingReadStatus] = useState(false);
  const [readStatusDetail, setReadStatusDetail] = useState<ReadStatusDetail | null>(null);

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

  async function fetchUsers() {
    setLoadingUsers(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/users');

      if (!response.ok) {
        throw new Error('\u30e6\u30fc\u30b6\u30fc\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
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
        throw new Error('\u9023\u7d61\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      const data: Message[] = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
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
            : '\u30e6\u30fc\u30b6\u30fc\u306e\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f';

        throw new Error(errorMessage);
      }

      setName('');
      setEmail('');
      setRole('STUDENT');
      setUserGrade('');
      setDepartment('');
      setNotice('\u30e6\u30fc\u30b6\u30fc\u3092\u8ffd\u52a0\u3057\u307e\u3057\u305f');

      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }

  async function handleEditUser(user: User) {
    const nextName = window.prompt('\u540d\u524d\u3092\u7de8\u96c6', user.name);
    if (nextName === null) {
      return;
    }

    const nextEmail = window.prompt('\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u7de8\u96c6', user.email);
    if (nextEmail === null) {
      return;
    }

    const nextGrade = window.prompt('\u5b66\u5e74\u3092\u7de8\u96c6\uff081\u301c5\u3001\u7a7a\u6b04\u3067\u672a\u6307\u5b9a\uff09', user.grade ? String(user.grade) : '');
    if (nextGrade === null) {
      return;
    }

    const nextDepartment = window.prompt('\u6240\u5c5e\u3092\u7de8\u96c6\uff08\u7a7a\u6b04\u3067\u672a\u6307\u5b9a\uff09', user.department ?? '');
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
              : '\u30e6\u30fc\u30b6\u30fc\u306e\u7de8\u96c6\u306b\u5931\u6557\u3057\u307e\u3057\u305f';

        throw new Error(errorMessage);
      }

      setNotice('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u3092\u7de8\u96c6\u3057\u307e\u3057\u305f');
      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }
  async function handleDeleteUser(user: User) {
    const ok = window.confirm(`${user.name} \u3092\u7121\u52b9\u5316\u3057\u307e\u3059\u304b\uff1f`);

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
        throw new Error('\u30e6\u30fc\u30b6\u30fc\u306e\u7121\u52b9\u5316\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      setNotice('\u30e6\u30fc\u30b6\u30fc\u3092\u7121\u52b9\u5316\u3057\u307e\u3057\u305f');
      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }

  async function handleActivateUser(user: User) {
    const ok = window.confirm(`${user.name} \u3092\u6709\u52b9\u5316\u3057\u307e\u3059\u304b\uff1f`);

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
        throw new Error('\u30e6\u30fc\u30b6\u30fc\u306e\u6709\u52b9\u5316\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      setNotice('\u30e6\u30fc\u30b6\u30fc\u3092\u6709\u52b9\u5316\u3057\u307e\u3057\u305f');
      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(' / ')
          : typeof errorData.message === 'string'
            ? errorData.message
            : '\u9023\u7d61\u306e\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f';

        throw new Error(errorMessage);
      }

      setMessageTitle('');
      setMessageBody('');
      setTargetRole('');
      setTargetGrade('');
      setTargetDepartment('');
      setNotice('\u9023\u7d61\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f');

      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }

  async function handleEditDraftMessage(message: Message) {
    if (message.status !== 'DRAFT') {
      setError('\u9001\u4fe1\u6e08\u307f\u306e\u9023\u7d61\u306f\u7de8\u96c6\u3067\u304d\u307e\u305b\u3093');
      return;
    }

    const nextTitle = window.prompt('\u30bf\u30a4\u30c8\u30eb\u3092\u7de8\u96c6', message.title);
    if (nextTitle === null) {
      return;
    }

    const nextBody = window.prompt('\u672c\u6587\u3092\u7de8\u96c6', message.body);
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
            : '\u9023\u7d61\u306e\u7de8\u96c6\u306b\u5931\u6557\u3057\u307e\u3057\u305f';

        throw new Error(errorMessage);
      }

      setNotice('\u4e0b\u66f8\u304d\u9023\u7d61\u3092\u7de8\u96c6\u3057\u307e\u3057\u305f');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }
  async function handleSendMessage(message: Message) {
    const ok = window.confirm(`${message.title} \u3092\u9001\u4fe1\u6e08\u307f\u306b\u3057\u307e\u3059\u304b\uff1f`);

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
        throw new Error('\u9023\u7d61\u306e\u9001\u4fe1\u51e6\u7406\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      setNotice('\u9023\u7d61\u3092\u9001\u4fe1\u6e08\u307f\u306b\u3057\u307e\u3057\u305f');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }

  async function handleShowReadStatus(message: Message) {
    setNotice('');
    setError('');
    setLoadingReadStatus(true);

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/read-status`);

      if (!response.ok) {
        throw new Error('\u65e2\u8aad\u72b6\u6cc1\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      const data: ReadStatusDetail = await response.json();
      setReadStatusDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    } finally {
      setLoadingReadStatus(false);
    }
  }

  async function handleDeleteMessage(message: Message) {
    const ok = window.confirm(`${message.title} \u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f`);

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
        throw new Error('\u9023\u7d61\u306e\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      if (readStatusDetail?.message.id === message.id) {
        setReadStatusDetail(null);
      }

      setNotice('\u9023\u7d61\u3092\u524a\u9664\u3057\u307e\u3057\u305f');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
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
    const roleText = message.targetRole ? roleLabels[message.targetRole] : '\u5168\u54e1';
    const gradeText = message.targetGrade ? `${message.targetGrade}\u5e74` : '\u5168\u5b66\u5e74';
    const departmentText = message.targetDepartment || '\u5168\u6240\u5c5e';

    return `${roleText} / ${gradeText} / ${departmentText}`;
  }

  function formatUserInfo(user: ReadStatusDetailUser) {
    const gradeText = user.grade ? `${user.grade}\u5e74` : '\u5b66\u5e74\u672a\u6307\u5b9a';
    const departmentText = user.department || '\u6240\u5c5e\u672a\u6307\u5b9a';

    return `${roleLabels[user.role]} / ${gradeText} / ${departmentText}`;
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Akashi Contact App</p>
          <h1>{'\u5b66\u6821\u9023\u7d61\u30a2\u30d7\u30ea \u7ba1\u7406\u753b\u9762'}</h1>
          <p className="header-text">
            {'\u30e6\u30fc\u30b6\u30fc\u7ba1\u7406\u3068\u5b66\u6821\u9023\u7d61\u306e\u4f5c\u6210\u3092\u884c\u3044\u307e\u3059\u3002'}
          </p>
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">{'\u767b\u9332\u30e6\u30fc\u30b6\u30fc'}</span>
          <strong>{users.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">{'\u6709\u52b9\u30e6\u30fc\u30b6\u30fc'}</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">{'\u751f\u5f92'}</span>
          <strong>{roleCounts.STUDENT}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">{'\u4f5c\u6210\u6e08\u307f\u9023\u7d61'}</span>
          <strong>{messages.length}</strong>
        </div>
      </section>

      {notice && <p className="global-success">{notice}</p>}
      {error && <p className="global-error">{error}</p>}

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{'\u9023\u7d61\u4f5c\u6210'}</h2>
            <p>{'\u5b66\u6821\u304b\u3089\u914d\u4fe1\u3059\u308b\u9023\u7d61\u306e\u30bf\u30a4\u30c8\u30eb\u3001\u672c\u6587\u3001\u5b9b\u5148\u6761\u4ef6\u3092\u4f5c\u6210\u3057\u307e\u3059\u3002'}</p>
          </div>
        </div>

        <form className="message-form" onSubmit={handleCreateMessage}>
          <label>
            {'\u30bf\u30a4\u30c8\u30eb'}
            <input
              value={messageTitle}
              onChange={(event) => setMessageTitle(event.target.value)}
              placeholder={'\u4f8b\uff1a\u660e\u65e5\u306e\u4e88\u5b9a\u306b\u3064\u3044\u3066'}
            />
          </label>

          <label>
            {'\u672c\u6587'}
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder={'\u4f8b\uff1a\u660e\u65e5\u306f\u901a\u5e38\u901a\u308a\u6388\u696d\u3092\u884c\u3044\u307e\u3059\u3002'}
              rows={5}
            />
          </label>

          <div className="target-grid">
            <label>
              {'\u5b9b\u5148\u7a2e\u5225'}
              <select
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value as UserRole | '')}
              >
                <option value="">{'\u5168\u54e1'}</option>
                <option value="STUDENT">{roleLabels.STUDENT}</option>
                <option value="PARENT">{roleLabels.PARENT}</option>
                <option value="TEACHER">{roleLabels.TEACHER}</option>
                <option value="STAFF">{roleLabels.STAFF}</option>
                <option value="ADMIN">{roleLabels.ADMIN}</option>
              </select>
            </label>

            <label>
              {'\u5bfe\u8c61\u5b66\u5e74'}
              <select
                value={targetGrade}
                onChange={(event) => setTargetGrade(event.target.value)}
              >
                <option value="">{'\u5168\u5b66\u5e74'}</option>
                <option value="1">1{'\u5e74'}</option>
                <option value="2">2{'\u5e74'}</option>
                <option value="3">3{'\u5e74'}</option>
                <option value="4">4{'\u5e74'}</option>
                <option value="5">5{'\u5e74'}</option>
              </select>
            </label>

            <label>
              {'\u5bfe\u8c61\u6240\u5c5e'}
              <select
                value={targetDepartment}
                onChange={(event) => setTargetDepartment(event.target.value)}
              >
                {departmentOptions.map((option) => (
                  <option key={`target-${option.value || 'all'}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="primary-button">

          <div className="target-preview">
            <div className="target-preview-main">
              <span>{'\u5bfe\u8c61\u4e88\u5b9a'}</span>
              <strong>{draftTargetUsers.length}{'\u4eba'}</strong>
            </div>

            {draftTargetUsers.length > 0 ? (
              <ul>
                {draftTargetUsers.slice(0, 5).map((user) => (
                  <li key={user.id}>
                    {user.name}
                    <small>
                      {roleLabels[user.role]} / {user.grade ? `${user.grade}\u5e74` : '\u5b66\u5e74\u672a\u6307\u5b9a'} / {user.department || '\u6240\u5c5e\u672a\u6307\u5b9a'}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{'\u3053\u306e\u6761\u4ef6\u306b\u8a72\u5f53\u3059\u308b\u6709\u52b9\u30e6\u30fc\u30b6\u30fc\u306f\u3044\u307e\u305b\u3093\u3002'}</p>
            )}

            {draftTargetUsers.length > 5 && (
              <p className="target-preview-more">
                {'\u307b\u304b'} {draftTargetUsers.length - 5} {'\u4eba'}
              </p>
            )}
          </div>

          <button type="submit" className="primary-button">
            {'\u9023\u7d61\u3092\u4f5c\u6210'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{'\u9023\u7d61\u4e00\u89a7'}</h2>
            <p>{'\u4f5c\u6210\u6e08\u307f\u306e\u5b66\u6821\u9023\u7d61\u3092\u8868\u793a\u3057\u307e\u3059\u3002'}</p>
          </div>
          <button type="button" className="secondary-button" onClick={fetchMessages}>
            {'\u518d\u8aad\u307f\u8fbc\u307f'}
          </button>
        </div>

        <div className="message-filter-bar">
          <label>
            {'\u691c\u7d22'}
            <input
              value={messageSearch}
              onChange={(event) => setMessageSearch(event.target.value)}
              placeholder={'\u30bf\u30a4\u30c8\u30eb\u30fb\u672c\u6587\u3067\u691c\u7d22'}
            />
          </label>

          <label>
            {'\u72b6\u614b'}
            <select
              value={messageStatusFilter}
              onChange={(event) => setMessageStatusFilter(event.target.value as MessageStatus | 'ALL')}
            >
              <option value="ALL">{'\u3059\u3079\u3066'}</option>
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
            {'\u6761\u4ef6\u30af\u30ea\u30a2'}
          </button>

          <p>
            {'\u8868\u793a'}: {filteredMessages.length} / {messages.length}
          </p>
        </div>

        {loadingMessages && <p className="muted">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>}

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
                      {'\u5b9b\u5148'}: {getTargetLabel(message)}
                    </p>

                    <div className="read-summary">
                      <span>{'\u5bfe\u8c61'}: {targetCount}</span>
                      <span>{'\u65e2\u8aad'}: {readCount}</span>
                      <span>{'\u672a\u8aad'}: {message.status === 'SENT' ? unreadCount : '-'}</span>
                    </div>
                  </div>

                  <div className="message-actions">
                    <time>{new Date(message.createdAt).toLocaleString('ja-JP')}</time>

                    <button
                      type="button"
                      className="read-status-button"
                      onClick={() => handleShowReadStatus(message)}
                    >
                      {'\u65e2\u8aad\u72b6\u6cc1'}
                    </button>

                    {message.status === 'DRAFT' && (
                      <>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditDraftMessage(message)}
                        >
                          {'\u7de8\u96c6'}
                        </button>

                        <button
                          type="button"
                          className="send-button"
                          onClick={() => handleSendMessage(message)}
                        >
                          {'\u9001\u4fe1'}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteMessage(message)}
                    >
                      {'\u524a\u9664'}
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredMessages.length === 0 && (
              <p className="muted">{'\u6761\u4ef6\u306b\u4e00\u81f4\u3059\u308b\u9023\u7d61\u306f\u3042\u308a\u307e\u305b\u3093\u3002'}</p>
            )}
          </div>
        )}
      </section>

      {(loadingReadStatus || readStatusDetail) && (
        <section className="card read-detail-panel">
          <div className="section-heading">
            <div>
              <h2>{'\u65e2\u8aad\u72b6\u6cc1'}</h2>
              <p>
                {readStatusDetail
                  ? `\u9023\u7d61\u300c${readStatusDetail.message.title}\u300d\u306e\u78ba\u8a8d\u72b6\u6cc1\u3067\u3059\u3002`
                  : '\u65e2\u8aad\u72b6\u6cc1\u3092\u8aad\u307f\u8fbc\u3093\u3067\u3044\u307e\u3059\u3002'}
              </p>
            </div>

            {readStatusDetail && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setReadStatusDetail(null)}
              >
                {'\u9589\u3058\u308b'}
              </button>
            )}
          </div>

          {loadingReadStatus && <p className="muted">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>}

          {readStatusDetail && !loadingReadStatus && (
            <>
              <div className="read-detail-summary">
                <div>
                  <span>{'\u5b9b\u5148\u6761\u4ef6'}</span>
                  <strong>{getTargetLabel(readStatusDetail.message)}</strong>
                </div>
                <div>
                  <span>{'\u65e2\u8aad'}</span>
                  <strong>{readStatusDetail.readCount}</strong>
                </div>
                <div>
                  <span>{'\u672a\u8aad'}</span>
                  <strong>{readStatusDetail.unreadCount}</strong>
                </div>
              </div>

              <div className="read-detail-columns">
                <section>
                  <h3>{'\u65e2\u8aad\u8005'}</h3>

                  {readStatusDetail.readUsers.length > 0 ? (
                    <ul className="read-user-list">
                      {readStatusDetail.readUsers.map((user) => (
                        <li key={`read-${user.id}`}>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                          <small>{formatUserInfo(user)}</small>
                          {user.readAt && (
                            <small>
                              {'\u78ba\u8a8d\u65e5\u6642'}: {new Date(user.readAt).toLocaleString('ja-JP')}
                            </small>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">{'\u307e\u3060\u8ab0\u3082\u78ba\u8a8d\u3057\u3066\u3044\u307e\u305b\u3093\u3002'}</p>
                  )}
                </section>

                <section>
                  <h3>{'\u672a\u8aad\u8005'}</h3>

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
                    <p className="all-read-message">{'\u5168\u54e1\u304c\u78ba\u8a8d\u6e08\u307f\u3067\u3059\u3002'}</p>
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
            <h2>{'\u30e6\u30fc\u30b6\u30fc\u8ffd\u52a0'}</h2>
            <p>{'\u540d\u524d\u3001\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3001\u6a29\u9650\u3001\u5b66\u5e74\u3001\u6240\u5c5e\u3092\u5165\u529b\u3057\u3066\u30e6\u30fc\u30b6\u30fc\u3092\u767b\u9332\u3057\u307e\u3059\u3002'}</p>
          </div>
        </div>

        <form className="form" onSubmit={handleCreateUser}>
          <label>
            {'\u540d\u524d'}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={'\u4f8b\uff1a\u5c71\u7530 \u592a\u90ce'}
            />
          </label>

          <label>
            {'\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9'}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
            />
          </label>

          <label>
            {'\u6a29\u9650'}
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
            {'\u5b66\u5e74'}
            <select
              value={userGrade}
              onChange={(event) => setUserGrade(event.target.value)}
            >
              <option value="">{'\u672a\u6307\u5b9a'}</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>

          <label>
            {'\u6240\u5c5e'}
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
            {'\u8ffd\u52a0'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{'\u30e6\u30fc\u30b6\u30fc\u4e00\u89a7'}</h2>
            <p>{'\u73fe\u5728\u767b\u9332\u3055\u308c\u3066\u3044\u308b\u30e6\u30fc\u30b6\u30fc\u3092\u8868\u793a\u3057\u307e\u3059\u3002'}</p>
          </div>
          <button type="button" className="secondary-button" onClick={fetchUsers}>
            {'\u518d\u8aad\u307f\u8fbc\u307f'}
          </button>
        </div>

        <div className="user-filter-bar">
          <label>
            {'\u691c\u7d22'}
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder={'\u540d\u524d\u30fb\u30e1\u30fc\u30eb\u30fb\u6240\u5c5e\u3067\u691c\u7d22'}
            />
          </label>

          <label>
            {'\u6a29\u9650'}
            <select
              value={userRoleFilter}
              onChange={(event) => setUserRoleFilter(event.target.value as UserRole | 'ALL')}
            >
              <option value="ALL">{'\u3059\u3079\u3066'}</option>
              <option value="STUDENT">{roleLabels.STUDENT}</option>
              <option value="PARENT">{roleLabels.PARENT}</option>
              <option value="TEACHER">{roleLabels.TEACHER}</option>
              <option value="STAFF">{roleLabels.STAFF}</option>
              <option value="ADMIN">{roleLabels.ADMIN}</option>
            </select>
          </label>

          <label>
            {'\u72b6\u614b'}
            <select
              value={userActiveFilter}
              onChange={(event) => setUserActiveFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            >
              <option value="ALL">{'\u3059\u3079\u3066'}</option>
              <option value="ACTIVE">{'\u6709\u52b9'}</option>
              <option value="INACTIVE">{'\u7121\u52b9'}</option>
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
            {'\u6761\u4ef6\u30af\u30ea\u30a2'}
          </button>

          <p>
            {'\u8868\u793a'}: {filteredUsers.length} / {users.length}
          </p>
        </div>

        {loadingUsers && <p className="muted">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>}

        {!loadingUsers && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{'\u540d\u524d'}</th>
                  <th>{'\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9'}</th>
                  <th>{'\u6a29\u9650'}</th>
                  <th>{'\u5b66\u5e74'}</th>
                  <th>{'\u6240\u5c5e'}</th>
                  <th>{'\u72b6\u614b'}</th>
                  <th>{'\u4f5c\u6210\u65e5\u6642'}</th>
                  <th>{'\u64cd\u4f5c'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td className="name-cell">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role.toLowerCase()}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td>{user.grade ?? '-'}</td>
                    <td>{user.department || '-'}</td>
                    <td>{user.isActive ? '\u6709\u52b9' : '\u7121\u52b9'}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <div className="user-action-buttons">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditUser(user)}
                        >
                          {'\u7de8\u96c6'}
                        </button>

                        {user.isActive ? (
                          <button
                            type="button"
                            className="deactivate-button"
                            onClick={() => handleDeleteUser(user)}
                          >
                            {'\u7121\u52b9\u5316'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="activate-button"
                            onClick={() => handleActivateUser(user)}
                          >
                            {'\u6709\u52b9\u5316'}
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
                {'\u6761\u4ef6\u306b\u4e00\u81f4\u3059\u308b\u30e6\u30fc\u30b6\u30fc\u306f\u3044\u307e\u305b\u3093\u3002'}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminPage;