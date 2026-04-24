import { FormEvent, useEffect, useState } from 'react';
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

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  return (
    <main className="page">
      <section className="card">
        <h1>ユーザー管理</h1>
        <p className="description">
          ユーザーの追加と一覧表示を行います。
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
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
          </div>

          <button type="submit">追加</button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <h2>ユーザー一覧</h2>

        {loading && <p>読み込み中...</p>}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>名前</th>
                <th>メールアドレス</th>
                <th>権限</th>
                <th>有効</th>
                <th>作成日時</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? '有効' : '無効'}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default App;