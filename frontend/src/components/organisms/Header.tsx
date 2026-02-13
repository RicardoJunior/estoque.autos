import React from 'react';
import { useAuthStore } from '@/store/authStore';

export const Header: React.FC = () => {
  const { user, tenant, signOut } = useAuthStore();

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4">
      <div className="flex-1">
        <a className="text-xl font-bold">{tenant?.name || 'Estoque.autos'}</a>
      </div>
      <div className="flex-none gap-2">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              {user?.avatar_url ? (
                <img alt={user.name} src={user.avatar_url} />
              ) : (
                <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow border border-base-300"
          >
            <li className="menu-title">
              <span>{user?.name}</span>
              <span className="text-xs opacity-60">{user?.email}</span>
            </li>
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">{user?.role}</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <button onClick={() => signOut()}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
