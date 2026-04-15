// src/pages/DashboardPage.jsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

// --- API İSTEKLERİ ---
const fetchMe = async () => (await apiClient.get('/auth/me')).data;
const fetchAllCongresses = async () => (await apiClient.get('/congresses')).data;
const fetchMySubmissions = async () => (await apiClient.get('/submissions/me')).data;
const fetchMyReviews = async () => (await apiClient.get('/reviews/me')).data;

function DashboardPage() {
    const navigate = useNavigate();
    
    // SEKMELER: 'my-congresses' (Organizasyonlarım) veya 'explore' (Keşfet)
    const [activeTab, setActiveTab] = useState('my-congresses');
    const [searchTerm, setSearchTerm] = useState('');

    // --- VERİLERİ PARALEL ÇEKME ---
    const { data: user, isLoading: isLoadingUser } = useQuery({ queryKey: ['me'], queryFn: fetchMe });
    const { data: congresses, isLoading: isLoadingCongresses } = useQuery({ queryKey: ['congresses'], queryFn: fetchAllCongresses });
    const { data: submissions } = useQuery({ queryKey: ['mySubmissions'], queryFn: fetchMySubmissions });
    const { data: reviews } = useQuery({ queryKey: ['myReviews'], queryFn: fetchMyReviews });

    if (isLoadingUser || isLoadingCongresses) {
        return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><span className="text-slate-500 font-medium tracking-wide">Kumanda Merkezi Yükleniyor...</span></div>;
    }

    // --- VERİ FİLTRELEME & İSTATİSTİKLER ---
    const myCongresses = congresses?.filter(c => c.created_by === user?.id) || [];
    const pendingReviewsCount = reviews?.filter(r => r.review_status !== 'Tamamlandı').length || 0;
    
    // Aktif sekmeye ve arama kelimesine göre gösterilecek kongreler
    const displayCongresses = activeTab === 'my-congresses' 
        ? myCongresses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : (congresses || []).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Hoşgeldin mesajı için saat hesaplama
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi Günler' : 'İyi Akşamlar';

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
            
            {/* --- ÜST BİLGİ VE KARŞILAMA (HERO) --- */}
            <header className="bg-slate-900 pt-10 pb-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="container mx-auto max-w-7xl relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight mb-2">
                            {greeting}, {user?.first_name}
                        </h1>
                        <p className="text-slate-400 text-sm tracking-wide">
                            Akademik Kongre ve Bildiri Yönetim Sistemine hoş geldiniz.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/profile" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-sm text-xs font-semibold transition-all">
                            Profilim
                        </Link>
                        <button 
                            onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} 
                            className="bg-rose-600 hover:bg-rose-700 border border-rose-600 text-white px-4 py-2 rounded-sm text-xs font-semibold transition-all shadow-sm"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 max-w-7xl -mt-12 relative z-20">
                
                {/* --- İSTATİSTİK KARTLARI --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    
                    {/* Yönetici Kartı */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Yönetici Paneli</p>
                                <h3 className="text-sm font-bold text-slate-800">Organizasyonlarım</h3>
                            </div>
                            <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl border border-indigo-100">🏛️</div>
                        </div>
                        <div className="flex items-end justify-between mt-4">
                            <span className="text-4xl font-serif font-bold text-slate-900 leading-none">{myCongresses.length}</span>
                            <Link to="/dashboard/congresses/new" className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors uppercase tracking-wider px-3 py-1.5 rounded-sm shadow-sm opacity-0 group-hover:opacity-100">
                                + Yeni Kur
                            </Link>
                        </div>
                    </div>

                    {/* Yazar Kartı */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-emerald-300 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Yazar Paneli</p>
                                <h3 className="text-sm font-bold text-slate-800">Çalışmalarım</h3>
                            </div>
                            <div className="w-10 h-10 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl border border-emerald-100">📄</div>
                        </div>
                        <div className="flex items-end justify-between mt-4">
                            <span className="text-4xl font-serif font-bold text-slate-900 leading-none">{submissions?.length || 0}</span>
                            <Link to="/dashboard/my-submissions" className="text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider border border-slate-200 hover:border-slate-300 bg-slate-50 px-3 py-1.5 rounded-sm">
                                Tümünü Gör &rarr;
                            </Link>
                        </div>
                    </div>

                    {/* Hakem Kartı */}
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-amber-300 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kurul Üyeliği</p>
                                <h3 className="text-sm font-bold text-slate-800">Bekleyen İncelemeler</h3>
                            </div>
                            <div className="w-10 h-10 rounded bg-amber-50 flex items-center justify-center text-amber-600 text-xl border border-amber-100">🔍</div>
                        </div>
                        <div className="flex items-end justify-between mt-4">
                            <span className="text-4xl font-serif font-bold text-slate-900 leading-none">{pendingReviewsCount}</span>
                            <Link to="/dashboard/my-reviews" className="text-[10px] font-bold text-amber-700 hover:text-amber-900 transition-colors uppercase tracking-wider border border-amber-200 hover:border-amber-300 bg-amber-50 px-3 py-1.5 rounded-sm">
                                Raporlara Git &rarr;
                            </Link>
                        </div>
                    </div>

                </div>

                {/* --- ALT BÖLÜM (KONGRE LİSTESİ VE SEKMELER) --- */}
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]">
                    
                    {/* Sekmeler ve Arama Çubuğu */}
                    <div className="border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 gap-4">
                        <div className="flex gap-6">
                            <button 
                                onClick={() => setActiveTab('my-congresses')}
                                className={`pb-1 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'my-congresses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Organizasyonlarım
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">{myCongresses.length}</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('explore')}
                                className={`pb-1 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'explore' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                Kongre Keşfet
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">{congresses?.length || 0}</span>
                            </button>
                        </div>

                        <div className="relative w-full md:w-72">
                            <input 
                                type="text" 
                                placeholder="Kongre ara..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-9 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-slate-50 transition-all" 
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    {/* Liste İçeriği */}
                    <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto">
                        {displayCongresses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="text-4xl mb-4 opacity-50">📂</div>
                                <h3 className="text-lg font-bold text-slate-700 mb-1">
                                    {activeTab === 'my-congresses' ? 'Hiç Kongreniz Yok' : 'Kongre Bulunamadı'}
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    {activeTab === 'my-congresses' 
                                        ? 'Yönettiğiniz bir kongre bulunmuyor. Sağ üstteki butonu kullanarak yeni bir kongre organizasyonu başlatabilirsiniz.' 
                                        : 'Arama kriterlerinize uygun aktif bir kongre bulunamadı.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> 
                                {displayCongresses.map(congress => (
                                    <Link 
                                        key={congress.id} 
                                        to={`/dashboard/congresses/${congress.id}`} 
                                        className="group flex flex-col bg-white rounded-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className={`h-1.5 transition-colors ${activeTab === 'my-congresses' ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-[15px] leading-snug text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                {congress.name}
                                            </h3>
                                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4 line-clamp-1">
                                                {congress.topic}
                                            </p>
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Tarihi</span>
                                                    <span className="text-xs font-semibold text-slate-700">{new Date(congress.start_date).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}

export default DashboardPage;