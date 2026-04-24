import { useEffect, useMemo, useState } from 'react';
import './App.css';

type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
type MessageStatus = 'DRAFT' | 'SENT';

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

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  grade?: number | null;
  department?: string | null;
  isActive: boolean;
};

const roleLabels: Record<UserRole, string> = {
  STUDENT: '\u751f\u5f92',
  PARENT: '\u4fdd\u8b77\u8005',
  TEACHER: '\u6559\u54e1',
  STAFF: '\u4e8b\u52d9',
  ADMIN: '\u7ba1\u7406\u8005',
};

function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = useMemo(() => {
    return users.find((user) => user.id === currentUserId) ?? null;
  }, [users, currentUserId]);

  async function fetchUsers() {
    const response = await fetch('http://localhost:3000/users');

    if (!response.ok) {
      throw new Error('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    }

    const data: User[] = await response.json();
    const activeUsers = data.filter((user) => user.isActive);
    setUsers(activeUsers);
    return activeUsers;
  }

  async function fetchSentMessages(userId: number) {
    const response = await fetch(`http://localhost:3000/messages/sent?userId=${userId}`);

    if (!response.ok) {
      throw new Error('\u9023\u7d61\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    }

    const data: Message[] = await response.json();
    setMessages(data);
  }

  async function fetchInitialData(nextUserId?: number) {
    setLoading(true);
    setError('');

    try {
      const userList = await fetchUsers();
      const selectedUserId = nextUserId ?? currentUserId ?? userList[0]?.id ?? null;

      setCurrentUserId(selectedUserId);

      if (selectedUserId) {
        await fetchSentMessages(selectedUserId);
      } else {
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function handleChangeUser(userIdText: string) {
    const userId = Number(userIdText);

    if (Number.isNaN(userId)) {
      return;
    }

    setSelectedMessage(null);
    setCurrentUserId(userId);
    setLoading(true);
    setError('');

    try {
      await fetchSentMessages(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    } finally {
      setLoading(false);
    }
  }

  function isConfirmed(message: Message) {
    if (!currentUser) {
      return false;
    }

    return Boolean(
      message.readStatuses?.some((readStatus) => readStatus.userId === currentUser.id),
    );
  }

  const confirmedCount = useMemo(
    () => messages.filter((message) => isConfirmed(message)).length,
    [messages, currentUser],
  );

  const unreadCount = messages.length - confirmedCount;

  async function handleConfirm(message: Message) {
    if (!currentUser) {
      setError('\u78ba\u8a8d\u7528\u306e\u30e6\u30fc\u30b6\u30fc\u304c\u9078\u629e\u3055\u308c\u3066\u3044\u307e\u305b\u3093');
      return;
    }

    setError('');

    try {
      const response = await fetch(`http://localhost:3000/messages/${message.id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('\u958b\u5c01\u78ba\u8a8d\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
      }

      await fetchSentMessages(currentUser.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    }
  }

  function getUserInfo(user: User) {
    const gradeText = user.grade ? `${user.grade}\u5e74` : '\u5b66\u5e74\u672a\u6307\u5b9a';
    const departmentText = user.department || '\u6240\u5c5e\u672a\u6307\u5b9a';

    return `${roleLabels[user.role]} / ${gradeText} / ${departmentText}`;
  }

  return (
    <main className="akashi-user-shell">
      <header className="akashi-user-header">
        <button
          type="button"
          className="akashi-icon-button"
          onClick={() => setSelectedMessage(null)}
        >
          {'\u2039'}
        </button>

        <div className="akashi-header-title">
          <span>AKASHI KOSEN</span>
          <strong>{'\u5b66\u751f\u9023\u7d61\u30dd\u30fc\u30bf\u30eb'}</strong>
        </div>

        <button type="button" className="akashi-icon-button">
          {'\u22ef'}
        </button>
      </header>

      {!selectedMessage && (
        <section className="akashi-user-main">
          <section className="akashi-hero">
            <div>
              <p className="akashi-hero-label">{'\u660e\u77f3\u5de5\u696d\u9ad8\u7b49\u5c02\u9580\u5b66\u6821'}</p>
              <h1>{'\u5b66\u6821\u304b\u3089\u306e\u9023\u7d61'}</h1>
              <p>{'\u9078\u629e\u3057\u305f\u30e6\u30fc\u30b6\u30fc\u306e\u6a29\u9650\u30fb\u5b66\u5e74\u30fb\u6240\u5c5e\u306b\u5408\u3046\u9023\u7d61\u3060\u3051\u3092\u8868\u793a\u3057\u307e\u3059\u3002'}</p>
            </div>

            <div className="akashi-count-panel">
              <span>{'\u672a\u78ba\u8a8d'}</span>
              <strong>{unreadCount}</strong>
            </div>
          </section>

          <section className="akashi-user-selector-card">
            <label>
              {'\u8868\u793a\u30e6\u30fc\u30b6\u30fc'}
              <select
                value={currentUserId ?? ''}
                onChange={(event) => handleChangeUser(event.target.value)}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} / {roleLabels[user.role]}
                  </option>
                ))}
              </select>
            </label>

            {currentUser && (
              <p>
                <span>{'\u73fe\u5728\u306e\u6761\u4ef6'}</span>
                <strong>{getUserInfo(currentUser)}</strong>
              </p>
            )}
          </section>

          <section className="akashi-quick-row">
            <div>
              <span>{'\u8868\u793a\u4e2d'}</span>
              <strong>{messages.length}</strong>
            </div>
            <div>
              <span>{'\u78ba\u8a8d\u6e08\u307f'}</span>
              <strong>{confirmedCount}</strong>
            </div>
            <button type="button" onClick={() => fetchInitialData(currentUserId ?? undefined)}>
              {'\u66f4\u65b0'}
            </button>
          </section>

          {loading && <p className="akashi-muted">{'\u8aad\u307f\u8fbc\u307f\u4e2d...'}</p>}
          {error && <p className="akashi-error">{error}</p>}

          {!loading && !error && (
            <div className="akashi-message-stack">
              {messages.map((message) => {
                const confirmed = isConfirmed(message);

                return (
                  <button
                    type="button"
                    className={confirmed ? 'akashi-message-card confirmed' : 'akashi-message-card'}
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="akashi-card-top">
                      <span className={confirmed ? 'akashi-status-chip confirmed' : 'akashi-status-chip'}>
                        {confirmed ? '\u78ba\u8a8d\u6e08\u307f' : '\u672a\u78ba\u8a8d'}
                      </span>
                      <time>{new Date(message.createdAt).toLocaleString('ja-JP')}</time>
                    </div>

                    <h2>{message.title}</h2>
                    <p>{message.body}</p>

                    <div className="akashi-card-bottom">
                      <span>{'\u8a73\u7d30\u3092\u958b\u304f'}</span>
                      <strong>{'\u203a'}</strong>
                    </div>
                  </button>
                );
              })}

              {messages.length === 0 && (
                <p className="akashi-muted">
                  {'\u73fe\u5728\u3001\u3053\u306e\u30e6\u30fc\u30b6\u30fc\u5b9b\u3066\u306b\u8868\u793a\u3067\u304d\u308b\u9023\u7d61\u306f\u3042\u308a\u307e\u305b\u3093\u3002'}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {selectedMessage && (
        <section className="akashi-detail-screen">
          <article className="akashi-detail-paper">
            <div className="akashi-detail-school">
              <span>{'\u767a\u4fe1\u5143'}</span>
              <strong>{'\u660e\u77f3\u5de5\u696d\u9ad8\u7b49\u5c02\u9580\u5b66\u6821'}</strong>
            </div>

            <h1>{selectedMessage.title}</h1>

            <time>{new Date(selectedMessage.createdAt).toLocaleString('ja-JP')}</time>

            <div className="akashi-detail-body">
              {selectedMessage.body}
            </div>
          </article>

          <section className="akashi-confirm-box">
            <p>{'\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u305f\u3089\u62bc\u3057\u3066\u304f\u3060\u3055\u3044'}</p>

            {isConfirmed(selectedMessage) ? (
              <button type="button" className="akashi-confirm-button done">
                {'\u78ba\u8a8d\u6e08\u307f'}
              </button>
            ) : (
              <button
                type="button"
                className="akashi-confirm-button"
                onClick={() => handleConfirm(selectedMessage)}
              >
                {'\u78ba\u8a8d\u3057\u307e\u3057\u305f'}
              </button>
            )}
          </section>
        </section>
      )}

      <nav className="akashi-bottom-dock">
        <button type="button">
          <span>{'\u2302'}</span>
          {'\u30db\u30fc\u30e0'}
        </button>
        <button type="button" className="active">
          <span>{'\u2709'}</span>
          {'\u9023\u7d61'}
        </button>
        <button type="button">
          <span>{'\u25a4'}</span>
          {'\u8cc7\u6599'}
        </button>
        <button type="button">
          <span>{'\u2699'}</span>
          {'\u8a2d\u5b9a'}
        </button>
      </nav>
    </main>
  );
}

export default UserPage;