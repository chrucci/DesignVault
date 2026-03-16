import React, { useState, useEffect } from 'react';
import { isAuthenticated } from '../lib/auth';
import { signOut } from '../lib/supabase-auth';
import LoginForm from './LoginForm';
import ClipForm from './ClipForm';

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    isAuthenticated().then(setLoggedIn);
  }, []);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await signOut();
    setLoggedIn(false);
  };

  if (loggedIn === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <span>Loading...</span>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="header">
        <h1>Design Vault</h1>
        <button onClick={handleLogout}>Sign Out</button>
      </div>
      <div className="container">
        <ClipForm />
      </div>
    </div>
  );
}
