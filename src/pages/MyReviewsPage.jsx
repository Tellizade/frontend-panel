// src/pages/MyReviewsPage.jsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const fetchMyReviews = async () => (await apiClient.get('/reviews/me')).data;

// Durumlar için kurumsal, minimalist rozet stilleri (Tema renkleriyle uyumlu hale getirildi)
const StatusBadge = ({ status, decision }) => {
    if (status === 'Tamamlandı') {
        let decisionClass = "bg-slate-100 text-slate-700 border-slate-200";
        if (decision === 'Kabul') decisionClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (decision === 'Ret') decisionClass = "bg-rose-50 text-rose-700 border-rose-200";
        if (decision === 'Revizyon') decisionClass = "bg-amber-50 text-amber-700 border-amber-200";

        return (
            <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                    Tamamlandı
                </span>
                {decision && (
                    <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${decisionClass}`}>
                        {decision}
                    </span>
                )}
            </div>
        );
    }

    // Bekleyen durum için sade stil
    return (
        <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
            İnceleme Bekliyor
        </span>
    );
};

function MyReviewsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Bekleyenler');

    const { data: reviews, isLoading, error } = useQuery({
        queryKey: ['myReviews'],
        queryFn: fetchMyReviews
    });

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><span className="text-slate-500 font-medium text-sm">Veriler yükleniyor...</span></div>;
    if (error) return <div className="text-center p-12 text-rose-700 font-semibold bg-[#F8FAFC]">Sistemsel bir hata oluştu. Lütfen tekrar deneyin.</div>;

    const pendingReviews = reviews?.filter(r => r.review_status !== 'Tamamlandı') || [];
    const completedReviews = reviews?.filter(r => r.review_status === 'Tamamlandı') || [];
    const displayReviews = activeTab === 'Bekleyenler' ? pendingReviews : completedReviews;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            {/* ÜST BİLGİ ALANI */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 py-5 max-w-7xl flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Hakem Değerlendirme Paneli</h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Atanan bilimsel çalışmaları inceleyin ve akademik raporunuzu sunun.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                    >
                        &larr; Ana Sayfa
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-7xl">
                {/* SEKMELER */}
                <div className="flex items-center gap-1 mb-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('Bekleyenler')}
                        className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'Bekleyenler' 
                                ? 'border-slate-900 text-slate-900' 
                                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                        }`}
                    >
                        ⏳ Bekleyen Görevler
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === 'Bekleyenler' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {pendingReviews.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('Tamamlananlar')}
                        className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'Tamamlananlar' 
                                ? 'border-slate-900 text-slate-900' 
                                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                        }`}
                    >
                        ✅ Tamamlanan Raporlar
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${activeTab === 'Tamamlananlar' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {completedReviews.length}
                        </span>
                    </button>
                </div>

                {/* GÖREV LİSTESİ (TABLO YAPISI) */}
                {displayReviews.length === 0 ? (
                    <div className="bg-white p-16 rounded border border-slate-200 text-center flex flex-col items-center justify-center shadow-sm">
                        <p className="text-lg font-semibold text-slate-800 mb-1">
                            {activeTab === 'Bekleyenler' ? 'Atanmış yeni bir görev bulunmuyor.' : 'Henüz tamamlanmış bir raporunuz yok.'}
                        </p>
                        <p className="text-sm text-slate-500">Yeni atamalar yapıldığında bu alanda listelenecektir.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                        {/* Tablo Başlığı */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-1">Görev ID</div>
                            <div className="col-span-6">Bildiri Başlığı & Kongre Adı</div>
                            <div className="col-span-3">Mevcut Durum</div>
                            <div className="col-span-2 text-right">İşlem</div>
                        </div>

                        {/* Tablo Satırları */}
                        <div className="divide-y divide-slate-100">
                            {displayReviews.map(review => (
                                <div key={`review-${review.review_id}`} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50 transition-colors">
                                    
                                    {/* ID */}
                                    <div className="col-span-1 text-sm font-mono font-medium text-slate-500">
                                        #{review.review_id}
                                    </div>

                                    {/* Başlık ve Kongre */}
                                    <div className="col-span-6 pr-4">
                                        <h3 className="text-[15px] font-semibold text-slate-900 leading-snug">
                                            {review.submission_title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Kongre</span> 
                                            {review.congress_name}
                                        </p>
                                    </div>

                                    {/* Durum Rozeti */}
                                    <div className="col-span-3">
                                        <StatusBadge status={review.review_status} decision={review.decision} />
                                    </div>

                                    {/* Buton */}
                                    <div className="col-span-2 text-right">
                                        {review.review_status !== 'Tamamlandı' ? (
                                            <Link 
                                                to={`/dashboard/reviews/${review.review_id}`}
                                                className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded text-xs transition-colors shadow-sm"
                                            >
                                                İncelemeyi Başlat
                                            </Link>
                                        ) : (
                                            <Link 
                                                to={`/dashboard/reviews/${review.review_id}`}
                                                className="inline-block bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-1.5 px-3 rounded text-xs transition-colors shadow-sm"
                                            >
                                                Raporu Görüntüle
                                            </Link>
                                        )}
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

export default MyReviewsPage;