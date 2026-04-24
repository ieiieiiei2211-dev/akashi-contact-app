import { useState } from 'react';
import AdminPage from './AdminPage';
import UserPage from './UserPage';
import './App.css';

type ViewMode = 'admin' | 'user';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('admin');

  return (
    <>
      <div className="view-switcher">
        <button
          type="button"
          className={viewMode === 'admin' ? 'active' : ''}
          onClick={() => setViewMode('admin')}
        >
          {'\u7ba1\u7406\u753b\u9762'}
        </button>
        <button
          type="button"
          className={viewMode === 'user' ? 'active' : ''}
          onClick={() => setViewMode('user')}
        >
          {'\u30e6\u30fc\u30b6\u30fc\u753b\u9762'}
        </button>
      </div>

      {viewMode === 'admin' ? <AdminPage /> : <UserPage />}
    </>
  );
}

export default App;