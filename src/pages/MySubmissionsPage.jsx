// src/pages/MySubmissionsPage.jsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const fetchMySubmissions = async () => {
    const response = await apiClient.get('/submissions/me');
    return response.data;
};

// UI İÇİN DURUM MASKESİ (Veritabanındaki "Tam Metin Yüklendi" -> "Sunum Bekleniyor" olur)
const StatusBadge = ({ status }) => {
    let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
    let displayText = status;

    if (status === 'Tam Metin Yüklendi') {
        displayText = 'Sunum Bekleniyor';
    }

    if (['Kabul Edildi', 'Ödeme Onaylandı', 'Tam Metin Yüklendi', 'Sunum Yapıldı'].includes(status)) {
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (status === 'Reddedildi') {
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (status === 'Revizyon İstendi' || status === 'Beklemede') {
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (status === 'Hakem Değerlendirmesinde' || status === 'Revizyon Edildi') {
        badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${badgeStyle}`}>
            {status === 'Revizyon İstendi' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
            {status === 'Tam Metin Yüklendi' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
            {displayText}
        </span>
    );
};

function MySubmissionsPage() {
    const navigate = useNavigate();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [sortBy, setSortBy] = useState('newest'); 

    const { data: submissions, isLoading, error } = useQuery({
        queryKey: ['mySubmissions'],
        queryFn: fetchMySubmissions
    });

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><span className="text-slate-500 font-medium tracking-wide">Yükleniyor...</span></div>;
    if (error) return <div className="text-center p-12 text-rose-700 font-medium bg-[#F8FAFC]">Sistemsel bir hata oluştu.</div>;

    const processedSubmissions = submissions
        ?.filter(sub => {
            const matchesSearch = sub.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Tümü' || sub.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            return 0;
        }) || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
            
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 py-4 max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Yazar Paneli</h1>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Başvuru Takip Sistemi</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-xs font-semibold transition-colors">
                        &larr; Ana Sayfa
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 mt-8 max-w-7xl">
                
                <div className="bg-white border border-slate-200 rounded-sm p-4 mb-8 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Başlık ile Ara</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Makale başlığı yazın..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400 opacity-50">🔍</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Durum Filtresi</label>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer"
                        >
                            <option value="Tümü">Tüm Başvurular</option>
                            <option value="Beklemede">Beklemede</option>
                            <option value="Hakem Değerlendirmesinde">İnceleme Aşamasında</option>
                            <option value="Revizyon İstendi">Revizyon Bekleyenler</option>
                            <option value="Kabul Edildi">Kabul Edilenler</option>
                            <option value="Tam Metin Yüklendi">Sunum Bekleyenler</option>
                            <option value="Reddedildi">Reddedilenler</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sıralama</label>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-sm focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer"
                        >
                            <option value="newest">En Yeni (Tarih)</option>
                            <option value="oldest">En Eski (Tarih)</option>
                            <option value="title">A-Z (Başlık)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-serif font-medium text-slate-900">Çalışmalarım</h2>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-sm border border-slate-200 uppercase tracking-widest">
                        Bulunan: {processedSubmissions.length}
                    </span>
                </div>

                {processedSubmissions.length === 0 ? (
                    <div className="bg-white p-20 rounded-sm border border-slate-200 text-center flex flex-col items-center justify-center shadow-sm">
                        <p className="text-slate-400 font-medium font-serif italic">
                            {searchTerm || statusFilter !== 'Tümü' ? "Arama kriterlerine uygun sonuç bulunamadı." : "Henüz bir başvurunuz bulunmuyor."}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest hidden md:grid">
                            <div className="col-span-2">Kayıt Tarihi</div>
                            <div className="col-span-5">Makale Bilgileri</div>
                            <div className="col-span-3">Mevcut Durum</div>
                            <div className="col-span-2 text-right">İşlem</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {processedSubmissions.map(sub => (
                                <div key={sub.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-6 items-center hover:bg-slate-50/50 transition-colors group">
                                    
                                    <div className="col-span-2 hidden md:block text-xs font-medium text-slate-400 font-mono">
                                        {new Date(sub.created_at).toLocaleDateString('tr-TR')}
                                    </div>

                                    <div className="col-span-1 md:col-span-5 md:pr-6">
                                        <h3 className="text-[15px] font-semibold text-slate-900 leading-snug mb-1 group-hover:text-indigo-700 transition-colors">
                                            {sub.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                            <span>🏛️</span> {sub.congress_name || "Genel Kongre"}
                                        </p>
                                    </div>

                                    <div className="col-span-1 md:col-span-3 mt-2 md:mt-0">
                                        <StatusBadge status={sub.status} />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 md:text-right mt-4 md:mt-0">
                                        <Link 
                                            to={`/dashboard/my-submissions/${sub.id}`}
                                            className={`w-full md:w-auto inline-block font-semibold py-2 px-5 rounded-sm text-xs transition-colors shadow-sm text-center border
                                                ${sub.status === 'Revizyon İstendi' 
                                                    ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700' 
                                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {sub.status === 'Revizyon İstendi' ? 'Hemen Düzenle' : 'Dosyayı Gör'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default MySubmissionsPage;