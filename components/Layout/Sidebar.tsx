
import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_NAME } from '../../constants';

interface NavItemProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
      ${isActive 
        ? 'bg-purple-600 text-white shadow-md dark:bg-purple-700 dark:text-white' 
        : 'text-gray-700 hover:bg-gray-200 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400'}`
    }
  >
    {icon && <span className="mr-3 h-5 w-5">{icon}</span>}
    {label}
  </NavLink>
);

// Basic SVG Icons (replace with better ones if available)
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.11-.995l2.176.019c.55.008 1.02.453 1.11.995l.344 2.062c.596.343 1.156.766 1.658 1.26l1.473-1.043c.476-.338 1.08-.222 1.376.24l1.528 2.647c.296.522.182 1.168-.294 1.506l-1.473 1.043c.053.405.082.816.082 1.234s-.029.829-.082 1.234l1.473 1.043c.476.338.57 1.03.274 1.506l-1.528 2.647c-.296.463-.899.622-1.376.24l-1.473-1.044c-.502.493-1.062.917-1.658 1.26l-.344 2.062c-.09.542-.56.995-1.11.995l-2.176-.019a1.126 1.126 0 01-1.11-.995l-.344-2.062c-.596-.343-1.156-.766-1.658-1.26l-1.473 1.043c-.476-.338-1.08.222-1.376-.24l-1.528-2.647c-.296-.522-.182-1.168.294 1.506l1.473-1.043A8.33 8.33 0 016.002 12c0-.418.029-.829.082-1.234l-1.473-1.043c-.476-.338-.57-1.03-.274-1.506l1.528-2.647c.296-.463.899-.622 1.376.24l1.473 1.043c.502-.494 1.062-.917 1.658-1.26l.344-2.062z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg>;


export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 h-screen p-4 shadow-lg flex flex-col no-print">
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8 text-center">{APP_NAME}</div>
      <nav className="space-y-2 flex-grow">
        <NavItem to="/" label="Gösterge Paneli" icon={<HomeIcon />} />
        <NavItem to="/customers" label="Müşteriler" icon={<UsersIcon />} />
        <NavItem to="/orders" label="Siparişler & Teklifler" icon={<DocumentTextIcon />} />
        <NavItem to="/reports" label="Raporlar" icon={<ChartBarIcon />} />
        <NavItem to="/settings" label="Ayarlar" icon={<CogIcon />} />
      </nav>
      <div className="mt-auto text-center text-xs text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
        <p>Lokal Çalışan Uygulama</p>
      </div>
    </div>
  );
};