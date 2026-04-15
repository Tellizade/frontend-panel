// src/pages/ReviewDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// --- API İSTEKLERİ ---
const fetchReviewById = async (reviewId) => {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
};

const submitReview = async ({ reviewId, decision, comments }) => {
    const response = await apiClient.post(`/reviews/${reviewId}`, { decision, comments });
    return response.data;
};

function ReviewDetailPage() {
    const { reviewId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [decision, setDecision] = useState('');
    const [comments, setComments] = useState('');

    const { data: review, isLoading, error } = useQuery({
        queryKey: ['review', reviewId],
        queryFn: () => fetchReviewById(reviewId),
    });

    useEffect(() => {
        if (review && (review.status === 'Tamamlandı' || review.review_status === 'Tamamlandı')) {
            setDecision(review.decision || '');
            setComments(review.comments || '');
        }
    }, [review]);

    const reviewMutation = useMutation({
        mutationFn: submitReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
            queryClient.invalidateQueries({ queryKey: ['myReviews'] });
            toast.success('Değerlendirme raporunuz başarıyla iletildi.', {
                position: "bottom-center",
                theme: "dark"
            });
            navigate('/dashboard/my-reviews');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Kayıt işlemi başarısız oldu.", { position: "bottom-center" });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!decision) {
            toast.warn('Lütfen bir tavsiye kararı belirtiniz.', { position: "bottom-center" });
            return;
        }
        if (!comments.trim()) {
            toast.warn('Lütfen değerlendirme raporunuzu giriniz.', { position: "bottom-center" });
            return;
        }

        Swal.fire({
            title: 'Raporu Onaylıyor musunuz?',
            text: "Bu işlem geri alınamaz ve editör kuruluna iletilecektir.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Raporu İlet',
            cancelButtonText: 'İptal',
            reverseButtons: true,
            customClass: {
                title: 'font-serif text-2xl text-slate-900',
                htmlContainer: 'text-slate-600',
            }
        }).then((result) => {
            if (result.isConfirmed) {
                reviewMutation.mutate({ reviewId, decision, comments });
            }
        });
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><span className="text-slate-500 font-medium tracking-wide">Makale yükleniyor...</span></div>;
    
    if (error || !review) return <div className="text-center p-12 text-rose-700 font-medium bg-[#F8FAFC]">Belgeye erişilemedi veya sunucudan boş yanıt döndü.</div>;

    const isCompleted = review.status === 'Tamamlandı' || review.review_status === 'Tamamlandı';

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
            
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 md:px-12 py-4 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/dashboard/my-reviews')} 
                            className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Geri Dön
                        </button>
                        <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                        <span className="hidden sm:block text-xs font-semibold text-slate-400 tracking-widest uppercase">
                            Görev #{review?.review_id || review?.id}
                        </span>
                    </div>

                    <div>
                        {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Rapor İletildi
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> İnceleme Aşamasında
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 md:px-12 mt-12 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                
                {/* SOL: İÇERİK OKUMA ALANI */}
                <article className="lg:col-span-7 xl:col-span-8">
                    
                    <header className="mb-12 border-b border-slate-200 pb-8">
                        <p className="text-sm font-medium text-slate-500 mb-4">{review?.congress_name || "Akademik Bildiri"}</p>
                        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight mb-6">
                            {review?.submission_title || "Başlıksız Çalışma"}
                        </h1>
                        
                        <div className="flex flex-wrap gap-2 mt-6">
                            {(() => {
                                if (!review?.submission_keywords) return null;
                                let kwArray = Array.isArray(review.submission_keywords) ? review.submission_keywords : (typeof review.submission_keywords === 'string' ? review.submission_keywords.split(',') : []);
                                if (kwArray.length === 0) return null;

                                return kwArray.map((kw, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-sm text-xs font-medium tracking-wide">
                                        {typeof kw === 'string' ? kw.trim() : kw}
                                    </span>
                                ));
                            })()}
                        </div>
                    </header>

                    <section className="mb-16">
                        <h2 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Özet (Abstract)</h2>
                        <div className="prose prose-slate max-w-prose">
                            {review?.submission_abstract ? (
                                <p className="font-sans text-[17px] md:text-[18px] text-slate-700 leading-[1.8] tracking-normal text-justify">
                                    {review.submission_abstract}
                                </p>
                            ) : (
                                <p className="italic text-slate-500 bg-slate-50 p-6 border border-slate-200 rounded-sm text-sm">Bu çalışma için özet metni sağlanmamıştır.</p>
                            )}
                        </div>
                    </section>

                    {review?.full_text_path && (
                        <section className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">Araştırma Dosyası (Tam Metin)</h3>
                                <p className="text-xs text-slate-500 mt-1">Yazar tarafından sağlanan akademik belge.</p>
                            </div>
                            <a 
                                href={`http://localhost:3000/${review.full_text_path}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-5 py-2 rounded-sm text-sm font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                PDF Görüntüle
                            </a>
                        </section>
                    )}
                </article>

                {/* SAĞ: NOT VE DEĞERLENDİRME PANELİ */}
                <aside className="lg:col-span-5 xl:col-span-4">
                    <div className="sticky top-28 bg-white border border-slate-200 shadow-sm p-8 rounded-sm">
                        
                        <h2 className="font-serif text-xl font-medium text-slate-900 mb-8 border-b border-slate-100 pb-4">
                            Hakem Raporu
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Editör İçin Tavsiye Kararı</label>
                                <div className="space-y-3">
                                    
                                    <label className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all ${decision === 'Kabul' ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'} ${isCompleted ? 'opacity-60 cursor-default' : ''}`}>
                                        <div className="flex h-5 items-center">
                                            <input type="radio" name="decision" value="Kabul" checked={decision === 'Kabul'} onChange={(e) => setDecision(e.target.value)} disabled={isCompleted} className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900">Kabul</span>
                                            <span className="text-xs text-slate-500 mt-0.5 font-medium">Çalışma mevcut haliyle yayımlanabilir.</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all ${decision === 'Revizyon' ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'} ${isCompleted ? 'opacity-60 cursor-default' : ''}`}>
                                        <div className="flex h-5 items-center">
                                            <input type="radio" name="decision" value="Revizyon" checked={decision === 'Revizyon'} onChange={(e) => setDecision(e.target.value)} disabled={isCompleted} className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900">Revizyon Gerekli</span>
                                            <span className="text-xs text-slate-500 mt-0.5 font-medium">Yazar belirtilen eksikleri gidermelidir.</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all ${decision === 'Ret' ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'} ${isCompleted ? 'opacity-60 cursor-default' : ''}`}>
                                        <div className="flex h-5 items-center">
                                            <input type="radio" name="decision" value="Ret" checked={decision === 'Ret'} onChange={(e) => setDecision(e.target.value)} disabled={isCompleted} className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900">Ret</span>
                                            <span className="text-xs text-slate-500 mt-0.5 font-medium">Çalışma yeterli akademik standartta değil.</span>
                                        </div>
                                    </label>

                                </div>
                            </div>

                            <div>
                                <label className="flex justify-between items-end mb-3">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Değerlendirme Raporu</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Gizli & Anonim</span>
                                </label>
                                <textarea 
                                    value={comments || ''} 
                                    onChange={(e) => setComments(e.target.value)}
                                    rows="8" 
                                    placeholder="Yöntem, bulgular ve literatür katkısı hakkında akademik görüşlerinizi belirtiniz..."
                                    disabled={isCompleted} 
                                    className="w-full p-4 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 leading-relaxed focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 resize-y transition-colors font-medium placeholder-slate-300"
                                />
                            </div>
                            
                            {isCompleted ? (
                                <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-sm text-sm font-medium text-slate-600">
                                    Rapor editöre iletildi. Katkınız için teşekkürler.
                                </div>
                            ) : (
                                <button 
                                    type="submit" 
                                    disabled={reviewMutation.isPending}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold tracking-wide py-3.5 px-4 rounded-sm text-sm transition-colors disabled:bg-slate-400 shadow-sm"
                                >
                                    {reviewMutation.isPending ? 'Kayıt Yapılıyor...' : 'Raporu İlet'}
                                </button>
                            )}
                        </form>
                        
                    </div>
                </aside>

            </main>
        </div>
    );
}

export default ReviewDetailPage;