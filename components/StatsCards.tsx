

import React from 'react';
import { Customer } from '../types';
import { useLanguage } from './LanguageContext';

interface StatsCardsProps {
    customers: Customer[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ customers }) => {
    const { t } = useLanguage();
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.spent, 0);
    const newCustomers = customers.filter(c => c.status === 'Trial').length;
    const activeSubscriptions = customers.filter(c => c.status === 'Active').length;

    const stats = [
        { name: t('stats_total_revenue'), value: `$${totalRevenue.toLocaleString()}`, icon: DollarSignIcon },
        { name: t('stats_active_users'), value: totalCustomers, icon: UsersIcon },
        { name: t('stats_conversion_rate'), value: activeSubscriptions, icon: ChartBarIcon },
        { name: t('stats_active_now'), value: newCustomers, icon: ShoppingCartIcon },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className="bg-primary-100 p-3 rounded-full">
                        <stat.icon className="h-6 w-6 text-primary-600" />
                    </div>
                </div>
            ))}
        </div>
    );
};


const DollarSignIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.21 12.75 11 12 11c-.75 0-1.536.21-2.218.659-1.171.879-1.171 2.303 0 3.182z" />
    </svg>
);
const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-4.663M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
    </svg>
);
const ChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
    </svg>
);
const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.838-5.513a1.875 1.875 0 0 0-1.636-2.88H6.332M19.5 21a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
);

export default StatsCards;