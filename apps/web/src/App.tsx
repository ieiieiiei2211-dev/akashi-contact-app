import { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';

type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'ADMIN';

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const roleLabels: Record<UserRole, string> = {
  STUDENT: '生徒',
  PARENT: '保護者',
  TEACHER: '教員',
  STAFF: '事務',
  ADMIN: '管理者',
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
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
    setLoading(true);
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
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(' / ')
          : 'ユーザーの作成に失敗しました';

        throw new Error(errorMessage);
      }

      setName('');
      setEmail('');
      setRole('STUDENT');
      setMessage('ユーザーを追加しました');

      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  async function handleDelete(user: User) {
    const ok = window.confirm(`${user.name} を削除しますか？`);

    if (!ok) {
      return;
    }

    setMessage('');
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('ユーザーの削除に失敗しました');
      }

      setMessage('ユーザーを削除しました');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Akashi Contact App</p>
          <h1>学校連絡アプリ 管理画面</h1>
          <p className="header-text">
            生徒・保護者・教職員のユーザー情報を管理します。
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
          <span className="summary-label">教職員</span>
          <strong>{roleCounts.TEACHER + roleCounts.STAFF + roleCounts.ADMIN}</strong>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>ユーザー追加</h2>
            <p>名前、メールアドレス、権限を入力してユーザーを登録します。</p>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
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
              placeholder="例：student@example.com"
            />
          </label>

          <label>
            権限
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="STUDENT">生徒</option>
              <option value="PARENT">保護者</option>
              <option value="TEACHER">教員</option>
              <option value="STAFF">事務</option>
              <option value="ADMIN">管理者</option>
            </select>
          </label>

          <button type="submit" className="primary-button">
            追加
          </button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
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

        {loading && <p className="muted">読み込み中...</p>}

        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名前</th>
                  <th>メールアドレス</th>
                  <th>権限</th>
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
                    <td>{user.isActive ? '有効' : '無効'}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDelete(user)}
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

export default App;