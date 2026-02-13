import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  name: string;
  path?: string;
  icon: string;
  roles?: Array<'owner' | 'manager' | 'seller'>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Estoque', path: '/vehicles', icon: '🚗' },
  { name: 'Leads', path: '/leads', icon: '👥' },
  { name: 'Vendas', path: '/sales', icon: '💰', roles: ['owner', 'manager'] },
  { name: 'Usuários', path: '/users', icon: '👤', roles: ['owner', 'manager'] },
  {
    name: 'Financeiro',
    icon: '📈',
    roles: ['owner', 'manager'],
    children: [
      {
        name: 'Dashboard',
        path: '/financial',
        icon: '📊',
        roles: ['owner', 'manager'],
      },
      {
        name: 'Fluxo de Caixa',
        path: '/cash-flow',
        icon: '💵',
        roles: ['owner', 'manager'],
      },
      {
        name: 'Relatório de Margem',
        path: '/margin-report',
        icon: '📈',
        roles: ['owner', 'manager'],
      },
      {
        name: 'Relatório de Giro',
        path: '/turnover-report',
        icon: '🔄',
        roles: ['owner', 'manager'],
      },
    ],
  },
  { name: 'Integrações', path: '/integrations', icon: '🔗', roles: ['owner', 'manager'] },
  {
    name: 'Landing Page',
    icon: '🌐',
    roles: ['owner', 'manager'],
    children: [
      {
        name: 'Seletor de Template',
        path: '/landing-page/template',
        icon: '🎨',
        roles: ['owner', 'manager'],
      },
      {
        name: 'Cores',
        path: '/landing-page/colors',
        icon: '🎨',
        roles: ['owner', 'manager'],
      },
      { name: 'Logo', path: '/landing-page/logo', icon: '🖼️', roles: ['owner', 'manager'] },
    ],
  },
  { name: 'Configurações', path: '/settings', icon: '⚙️', roles: ['owner'] },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const filterChildren = (children?: NavItem[]) => {
    if (!children) return [];
    return children.filter((child) => !child.roles || (user && child.roles.includes(user.role)));
  };

  return (
    <aside className="w-64 bg-base-200 min-h-screen border-r border-base-300">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-primary">Estoque.autos</h2>
      </div>
      <ul className="menu p-4 w-full">
        {filteredItems.map((item) => {
          const hasChildren = item.children && filterChildren(item.children).length > 0;

          if (hasChildren) {
            return (
              <li key={item.name}>
                <button
                  onClick={() => toggleSubmenu(item.name)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-xs">{openSubmenus[item.name] ? '▼' : '▶'}</span>
                </button>
                {openSubmenus[item.name] && (
                  <ul className="ml-4">
                    {filterChildren(item.children).map((child) => (
                      <li key={child.path}>
                        <NavLink
                          to={child.path!}
                          className={({ isActive }) =>
                            isActive ? 'active bg-primary text-primary-content' : ''
                          }
                        >
                          <span className="text-lg">{child.icon}</span>
                          {child.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          return (
            <li key={item.path}>
              <NavLink
                to={item.path!}
                className={({ isActive }) =>
                  isActive ? 'active bg-primary text-primary-content' : ''
                }
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
