'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // A simple way to clear the cookie is to call a logout API route
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <button 
      onClick={handleLogout}
      title="Logout"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0.5rem',
        color: 'var(--danger-color)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '50%',
        marginLeft: '1rem',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <LogOut size={20} />
    </button>
  );
}
