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
  createdAt: string;
  updatedAt: string;
  readStatuses?: ReadStatus[];
};

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

function UserPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchCurrentUser() {
    const response = await fetch('http://localhost:3000/users');

    if (!response.ok) {
      throw new Error('\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    }

    const users: User[] = await response.json();
    const user = users[0] ?? null;
    setCurrentUser(user);
    return user;
  }

  async function fetchSentMessages(userId?: number) {
    const url = userId
      ? `http://localhost:3000/messages/sent?userId=${userId}`
      : 'http://localhost:3000/messages/sent';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('\u9023\u7d61\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    }

    const data: Message[] = await response.json();
    setMessages(data);
  }

  async function fetchInitialData() {
    setLoading(true);
    setError('');

    try {
      const user = await fetchCurrentUser();
      await fetchSentMessages(user?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      setError('\u78ba\u8a8d\u7528\u306e\u30c6\u30b9\u30c8\u30e6\u30fc\u30b6\u30fc\u304c\u3042\u308a\u307e\u305b\u3093');
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
              <p>{'\u3042\u306a\u305f\u306e\u5bfe\u8c61\u306b\u306a\u3063\u3066\u3044\u308b\u9001\u4fe1\u6e08\u307f\u9023\u7d61\u3060\u3051\u3092\u8868\u793a\u3057\u307e\u3059\u3002'}</p>

              {currentUser && (
                <p className="akashi-user-name">
                  {'\u8868\u793a\u4e2d\u306e\u30e6\u30fc\u30b6\u30fc\uff1a'}
                  {currentUser.name}
                  {' / '}
                  {currentUser.role}
                </p>
              )}
            </div>

            <div className="akashi-count-panel">
              <span>{'\u672a\u78ba\u8a8d'}</span>
              <strong>{unreadCount}</strong>
            </div>
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
            <button type="button" onClick={fetchInitialData}>
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
                  {'\u73fe\u5728\u3001\u3042\u306a\u305f\u5b9b\u3066\u306b\u8868\u793a\u3067\u304d\u308b\u9023\u7d61\u306f\u3042\u308a\u307e\u305b\u3093\u3002'}
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