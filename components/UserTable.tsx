import React, { useState } from 'react';
import { RegisteredUser } from '../types';
import { useLanguage } from './LanguageContext';

interface UserTableProps {
    users: RegisteredUser[];
    onDelete: (userId: string) => void;
    onUpdateUrl: (userId: string, newUrl: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onDelete, onUpdateUrl }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editUrl, setEditUrl] = useState('');

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.etsy_store_url && user.etsy_store_url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleEditClick = (user: RegisteredUser) => {
        setEditingId(user.id);
        setEditUrl(user.etsy_store_url || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditUrl('');
    };

    const handleSaveUrl = (userId: string) => {
        onUpdateUrl(userId, editUrl);
        setEditingId(null);
    };

    return (
        <div className="bg-metallic-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white tracking-tight">{t('user_table_title')}</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-metallic-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-64 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-metallic-500 absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('user_table_email')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('user_table_store')}</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('user_table_joined')}</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-metallic-400 uppercase tracking-wider">{t('user_table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-metallic-700 to-metallic-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        {user.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-metallic-300">
                                    {editingId === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editUrl}
                                                onChange={(e) => setEditUrl(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary-500 w-48"
                                            />
                                            <button onClick={() => handleSaveUrl(user.id)} className="text-green-400 hover:text-green-300 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                            <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300 p-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between group">
                                            {user.etsy_store_url ? (
                                                <a href={user.etsy_store_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 hover:underline truncate max-w-[200px]">
                                                    {user.etsy_store_url.replace('https://www.etsy.com/shop/', '')}
                                                </a>
                                            ) : (
                                                <span className="text-metallic-600">-</span>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="opacity-0 group-hover:opacity-100 ml-2 text-metallic-500 hover:text-primary-400 transition-opacity"
                                                title={t('edit')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-metallic-400">
                                    {formatDate(user.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => {
                                            if (window.confirm(t('user_delete_confirm'))) {
                                                onDelete(user.id);
                                            }
                                        }}
                                        className="text-metallic-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                        title={t('delete')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-metallic-500">
                        No users found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserTable;