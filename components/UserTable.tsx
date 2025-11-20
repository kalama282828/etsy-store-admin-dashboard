

import React, { useState } from 'react';
import { RegisteredUser } from '../types';
import { useLanguage } from './LanguageContext';

// Fix: Defined the missing UserTableProps interface.
interface UserTableProps {
    users: RegisteredUser[];
    onDelete: (userId: string) => void;
    onUpdateUrl: (userId: string, newUrl: string) => Promise<void>;
}

const UserTable: React.FC<UserTableProps> = ({ users, onDelete, onUpdateUrl }) => {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editUrl, setEditUrl] = useState('');

    const handleEditClick = (user: RegisteredUser) => {
        setEditingId(user.id);
        setEditUrl(user.etsy_store_url || '');
    };

    const handleSaveClick = async (userId: string) => {
        await onUpdateUrl(userId, editUrl);
        setEditingId(null);
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditUrl('');
    };

    const filteredUsers = users.filter(user =>
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.etsy_store_url && user.etsy_store_url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-slate-800">{t('user_table_title')}</h2>
                <div className="relative w-full sm:w-auto">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder={language === 'tr' ? "Kullanıcı veya mağaza ara..." : "Search user or store..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-l-lg">{t('user_table_email')}</th>
                            <th scope="col" className="px-6 py-3">{t('user_table_store')}</th>
                            <th scope="col" className="px-6 py-3">{t('user_table_joined')}</th>
                            <th scope="col" className="px-6 py-3 rounded-r-lg text-right">{t('user_table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap border-b border-slate-100">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">
                                        {editingId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editUrl}
                                                    onChange={(e) => setEditUrl(e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-primary-500"
                                                    placeholder="https://www.etsy.com/shop/..."
                                                />
                                                <button onClick={() => handleSaveClick(user.id)} className="text-green-600 hover:text-green-800">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button onClick={handleCancelClick} className="text-slate-400 hover:text-slate-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                {user.etsy_store_url ? (
                                                    <a href={user.etsy_store_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px]">
                                                        {user.etsy_store_url.replace('https://www.etsy.com/shop/', '')}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="opacity-0 group-hover:opacity-100 ml-2 text-slate-400 hover:text-primary-600 transition-opacity"
                                                    title={t('edit')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 border-b border-slate-100">{formatDate(user.created_at)}</td>
                                    <td className="px-6 py-4 border-b border-slate-100 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm(t('user_delete_confirm'))) {
                                                    onDelete(user.id);
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-800 font-medium hover:underline"
                                        >
                                            {t('delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-500">
                                    {users.length === 0
                                        ? (language === 'tr' ? "Henüz kayıtlı kullanıcı bulunmuyor." : "No registered users yet.")
                                        : (language === 'tr' ? "Aramanızla eşleşen kullanıcı bulunamadı." : "No users found matching your search.")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;