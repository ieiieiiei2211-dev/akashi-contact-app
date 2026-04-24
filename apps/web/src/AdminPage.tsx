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

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
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

  async function handleDeleteUser(user: User) {
    const ok = window.confirm(`${user.name} を削除しますか？`);

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
        throw new Error('ユーザーの削除に失敗しました');
      }

      setNotice('ユーザーを削除しました');
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
      setNotice('連絡を作成しました');

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

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/read-status`);

      if (!response.ok) {
        throw new Error('既読状況の取得に失敗しました');
      }

      const data = await response.json();

      const readUsers = (data.readUsers ?? []) as Array<{
        name: string;
        email: string;
        readAt?: string;
      }>;

      const unreadUsers = (data.unreadUsers ?? []) as Array<{
        name: string;
        email: string;
      }>;

      const readText =
        readUsers.length > 0
          ? readUsers.map((user) => `・${user.name} (${user.email})`).join('\n')
          : 'なし';

      const unreadText =
        unreadUsers.length > 0
          ? unreadUsers.map((user) => `・${user.name} (${user.email})`).join('\n')
          : 'なし';

      window.alert(
        `連絡: ${data.message.title}\n\n` +
          `既読: ${data.readCount}\n${readText}\n\n` +
          `未読: ${data.unreadCount}\n${unreadText}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
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

      setNotice('連絡を削除しました');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  function getTargetLabel(message: Message) {
    const roleText = message.targetRole ? roleLabels[message.targetRole] : '全員';
    const gradeText = message.targetGrade ? `${message.targetGrade}年` : '全学年';
    const departmentText = message.targetDepartment || '全所属';

    return `${roleText} / ${gradeText} / ${departmentText}`;
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

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>連絡作成</h2>
            <p>学校から配信する連絡のタイトル、本文、宛先条件を作成します。</p>
          </div>
        </div>

        <form className="message-form" onSubmit={handleCreateMessage}>
          <label>
            タイトル
            <input
              value={messageTitle}
              onChange={(event) => setMessageTitle(event.target.value)}
              placeholder="例：明日の予定について"
            />
          </label>

          <label>
            本文
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="例：明日は通常通り授業を行います。"
              rows={5}
            />
          </label>

          <div className="target-grid">
            <label>
              宛先種別
              <select
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value as UserRole | '')}
              >
                <option value="">全員</option>
                <option value="STUDENT">{roleLabels.STUDENT}</option>
                <option value="PARENT">{roleLabels.PARENT}</option>
                <option value="TEACHER">{roleLabels.TEACHER}</option>
                <option value="STAFF">{roleLabels.STAFF}</option>
                <option value="ADMIN">{roleLabels.ADMIN}</option>
              </select>
            </label>

            <label>
              対象学年
              <select
                value={targetGrade}
                onChange={(event) => setTargetGrade(event.target.value)}
              >
                <option value="">全学年</option>
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
              </select>
            </label>

            <label>
              対象所属
              <input
                value={targetDepartment}
                onChange={(event) => setTargetDepartment(event.target.value)}
                placeholder="例：Mechanical Engineering"
              />
            </label>
          </div>

          <button type="submit" className="primary-button">
            連絡を作成
          </button>
        </form>
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

        {loadingMessages && <p className="muted">読み込み中...</p>}

        {!loadingMessages && (
          <div className="message-list">
            {messages.map((message) => {
              const readCount = message.readStatuses?.length ?? 0;
              const unreadCount = Math.max(users.length - readCount, 0);

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

                    <div className="read-summary">
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

                    {message.status === 'DRAFT' && (
                      <button
                        type="button"
                        className="send-button"
                        onClick={() => handleSendMessage(message)}
                      >
                        送信
                      </button>
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

            {messages.length === 0 && (
              <p className="muted">まだ連絡は作成されていません。</p>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>ユーザー追加</h2>
            <p>名前、メールアドレス、権限、学年、所属を入力してユーザーを登録します。</p>
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
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="Mechanical Engineering"
            />
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

        {loadingUsers && <p className="muted">読み込み中...</p>}

        {!loadingUsers && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名前</th>
                  <th>メールアドレス</th>
                  <th>権限</th>
                  <th>学年</th>
                  <th>所属</th>
                  <th>状態</th>
                  <th>作成日時</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
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
                    <td>{user.isActive ? '有効' : '-'}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteUser(user)}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminPage;