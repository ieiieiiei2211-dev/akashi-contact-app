import { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';

type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
type MessageStatus = 'DRAFT' | 'SENT';

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
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
  createdAt: string;
  updatedAt: string;
  readStatuses?: ReadStatus[];
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

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');

  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');

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
        body: JSON.stringify({ name, email, role }),
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
      setNotice('\u30e6\u30fc\u30b6\u30fc\u3092\u8ffd\u52a0\u3057\u307e\u3057\u305f');

      await fetchUsers();
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }

  async function handleDeleteUser(user: User) {
    const ok = window.confirm(`${user.name} \u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f`);

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
        throw new Error('\u30e6\u30fc\u30b6\u30fc\u306e\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      setNotice('\u30e6\u30fc\u30b6\u30fc\u3092\u524a\u9664\u3057\u307e\u3057\u305f');
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
      setNotice('\u9023\u7d61\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f');

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

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/read-status`);

      if (!response.ok) {
        throw new Error('\u65e2\u8aad\u72b6\u6cc1\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
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
          ? readUsers
              .map((user) => `\u30fb${user.name} (${user.email})`)
              .join('\n')
          : '\u306a\u3057';

      const unreadText =
        unreadUsers.length > 0
          ? unreadUsers
              .map((user) => `\u30fb${user.name} (${user.email})`)
              .join('\n')
          : '\u306a\u3057';

      window.alert(
        `\u9023\u7d61: ${data.message.title}\n\n` +
          `\u65e2\u8aad: ${data.readCount}\n${readText}\n\n` +
          `\u672a\u8aad: ${data.unreadCount}\n${unreadText}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
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

      setNotice('\u9023\u7d61\u3092\u524a\u9664\u3057\u307e\u3057\u305f');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
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
            <p>{'\u5b66\u6821\u304b\u3089\u914d\u4fe1\u3059\u308b\u9023\u7d61\u306e\u30bf\u30a4\u30c8\u30eb\u3068\u672c\u6587\u3092\u4f5c\u6210\u3057\u307e\u3059\u3002'}</p>
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

        {loadingMessages && <p className="muted">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>}

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

                    <div className="read-summary">
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
                      <button
                        type="button"
                        className="send-button"
                        onClick={() => handleSendMessage(message)}
                      >
                        {'\u9001\u4fe1'}
                      </button>
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

            {messages.length === 0 && (
              <p className="muted">{'\u307e\u3060\u9023\u7d61\u306f\u4f5c\u6210\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002'}</p>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{'\u30e6\u30fc\u30b6\u30fc\u8ffd\u52a0'}</h2>
            <p>{'\u540d\u524d\u3001\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3001\u6a29\u9650\u3092\u5165\u529b\u3057\u3066\u30e6\u30fc\u30b6\u30fc\u3092\u767b\u9332\u3057\u307e\u3059\u3002'}</p>
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
                  <th>{'\u72b6\u614b'}</th>
                  <th>{'\u4f5c\u6210\u65e5\u6642'}</th>
                  <th>{'\u64cd\u4f5c'}</th>
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
                    <td>{user.isActive ? '\u6709\u52b9' : '-'}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteUser(user)}
                      >
                        {'\u524a\u9664'}
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