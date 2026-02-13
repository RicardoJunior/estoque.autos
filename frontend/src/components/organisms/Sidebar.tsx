import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  roles?: Array<'owner' | 'manager' | 'seller'>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Estoque', path: '/vehicles', icon: '🚗' },
  { name: 'Leads', path: '/leads', icon: '👥' },
  { name: 'Vendas', path: '/sales', icon: '💰', roles: ['owner', 'manager'] },
  { name: 'Vendedores', path: '/sellers', icon: '👤', roles: ['owner', 'manager'] },
  { name: 'Financeiro', path: '/financial', icon: '📈', roles: ['owner', 'manager'] },
  { name: 'Integrações', path: '/integrations', icon: '🔗', roles: ['owner', 'manager'] },
  { name: 'Landing Page', path: '/landing-page', icon: '🌐', roles: ['owner', 'manager'] },
  { name: 'Configurações', path: '/settings', icon: '⚙️', roles: ['owner'] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="w-64 bg-base-200 min-h-screen border-r border-base-300">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-primary">Estoque.autos</h2>
      </div>
      <ul className="menu p-4 w-full">
        {filteredItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'active bg-primary text-primary-content' : ''
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};
