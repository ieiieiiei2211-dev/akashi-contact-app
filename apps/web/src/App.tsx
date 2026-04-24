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
  STUDENT: '\u751f\u5f92',
  PARENT: '\u4fdd\u8b77\u8005',
  TEACHER: '\u6559\u54e1',
  STAFF: '\u4e8b\u52d9',
  ADMIN: '\u7ba1\u7406\u8005',
};

const text = {
  appName: 'Akashi Contact App',
  title: '\u5b66\u6821\u9023\u7d61\u30a2\u30d7\u30ea \u7ba1\u7406\u753b\u9762',
  subtitle: '\u751f\u5f92\u30fb\u4fdd\u8b77\u8005\u30fb\u6559\u8077\u54e1\u306e\u30e6\u30fc\u30b6\u30fc\u60c5\u5831\u3092\u7ba1\u7406\u3057\u307e\u3059\u3002',
  registeredUsers: '\u767b\u9332\u30e6\u30fc\u30b6\u30fc',
  activeUsers: '\u6709\u52b9\u30e6\u30fc\u30b6\u30fc',
  students: '\u751f\u5f92',
  staffUsers: '\u6559\u8077\u54e1',
  addUser: '\u30e6\u30fc\u30b6\u30fc\u8ffd\u52a0',
  addUserDescription: '\u540d\u524d\u3001\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3001\u6a29\u9650\u3092\u5165\u529b\u3057\u3066\u30e6\u30fc\u30b6\u30fc\u3092\u767b\u9332\u3057\u307e\u3059\u3002',
  name: '\u540d\u524d',
  email: '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9',
  role: '\u6a29\u9650',
  add: '\u8ffd\u52a0',
  userList: '\u30e6\u30fc\u30b6\u30fc\u4e00\u89a7',
  userListDescription: '\u73fe\u5728\u767b\u9332\u3055\u308c\u3066\u3044\u308b\u30e6\u30fc\u30b6\u30fc\u3092\u8868\u793a\u3057\u307e\u3059\u3002',
  reload: '\u518d\u8aad\u307f\u8fbc\u307f',
  loading: '\u8aad\u307f\u8fbc\u307f\u4e2d...',
  status: '\u72b6\u614b',
  createdAt: '\u4f5c\u6210\u65e5\u6642',
  action: '\u64cd\u4f5c',
  active: '\u6709\u52b9',
  delete: '\u524a\u9664',
  added: '\u30e6\u30fc\u30b6\u30fc\u3092\u8ffd\u52a0\u3057\u307e\u3057\u305f',
  deleted: '\u30e6\u30fc\u30b6\u30fc\u3092\u524a\u9664\u3057\u307e\u3057\u305f',
  fetchFailed: '\u30e6\u30fc\u30b6\u30fc\u4e00\u89a7\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
  createFailed: '\u30e6\u30fc\u30b6\u30fc\u306e\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
  deleteFailed: '\u30e6\u30fc\u30b6\u30fc\u306e\u524a\u9664\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
  unknownError: '\u4e0d\u660e\u306a\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f',
  deleteConfirm: '\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f',
  namePlaceholder: '\u4f8b\uff1a\u5c71\u7530 \u592a\u90ce',
  emailPlaceholder: '\u4f8b\uff1astudent@example.com',
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
        throw new Error(text.fetchFailed);
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.unknownError);
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
          : typeof errorData.message === 'string'
            ? errorData.message
            : text.createFailed;

        throw new Error(errorMessage);
      }

      setName('');
      setEmail('');
      setRole('STUDENT');
      setMessage(text.added);

      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.unknownError);
    }
  }

  async function handleDelete(user: User) {
    const ok = window.confirm(`${user.name} ${text.deleteConfirm}`);

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
        throw new Error(text.deleteFailed);
      }

      setMessage(text.deleted);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : text.unknownError);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">{text.appName}</p>
          <h1>{text.title}</h1>
          <p className="header-text">{text.subtitle}</p>
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">{text.registeredUsers}</span>
          <strong>{users.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">{text.activeUsers}</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">{text.students}</span>
          <strong>{roleCounts.STUDENT}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">{text.staffUsers}</span>
          <strong>{roleCounts.TEACHER + roleCounts.STAFF + roleCounts.ADMIN}</strong>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{text.addUser}</h2>
            <p>{text.addUserDescription}</p>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            {text.name}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={text.namePlaceholder}
            />
          </label>

          <label>
            {text.email}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={text.emailPlaceholder}
            />
          </label>

          <label>
            {text.role}
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
            {text.add}
          </button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{text.userList}</h2>
            <p>{text.userListDescription}</p>
          </div>
          <button type="button" className="secondary-button" onClick={fetchUsers}>
            {text.reload}
          </button>
        </div>

        {loading && <p className="muted">{text.loading}</p>}

        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{text.name}</th>
                  <th>{text.email}</th>
                  <th>{text.role}</th>
                  <th>{text.status}</th>
                  <th>{text.createdAt}</th>
                  <th>{text.action}</th>
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
                    <td>{user.isActive ? text.active : '-'}</td>
                    <td>{new Date(user.createdAt).toLocaleString('ja-JP')}</td>
                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDelete(user)}
                      >
                        {text.delete}
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