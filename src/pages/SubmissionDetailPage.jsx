// src/pages/SubmissionDetailPage.jsx

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const fetchSubmissionById = async (submissionId) => (await apiClient.get(`/submissions/${submissionId}`)).data;

function SubmissionDetailPage() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [editedAbstract, setEditedAbstract] = useState('');
    const [file, setFile] = useState(null);

    const { data: sub, isLoading, error } = useQuery({
        queryKey: ['submission', submissionId],
        queryFn: () => fetchSubmissionById(submissionId),
        enabled: !!submissionId // submissionId undefined ise istek atma
    });

    const reviseMutation = useMutation({
        mutationFn: async (abstractData) => await apiClient.put(`/submissions/${submissionId}`, { abstract: abstractData }),
        onSuccess: () => {
            toast.success("Revizyon başarıyla gönderildi.", { position: "bottom-center", theme: "dark" });
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
        },
        onError: () => toast.error("Revizyon gönderilirken hata oluştu.")
    });

    const payMutation = useMutation({
        mutationFn: async () => await apiClient.post(`/submissions/${submissionId}/pay`),
        onSuccess: () => {
            toast.success("Ödeme onaylandı! Artık PDF yükleyebilirsiniz.", { position: "bottom-center", theme: "dark" });
            queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
        },
        onError: () => toast.error("Ödeme işlemi başarısız oldu.")
    });

    const uploadMutation = useMutation({
        mutationFn: async (formData) => {
            return await apiClient.post(`/submissions/${submissionId}/upload-fulltext`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            toast.success("Tam metin başarıyla yüklendi.", { position: "bottom-center", theme: "dark" });
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
        },
        onError: (err) => toast.error(err.response?.data?.error || "Dosya yüklenemedi.")
    });

    const joinRoomMutation = useMutation({
        mutationFn: async () => await apiClient.post(`/submissions/${submissionId}/join`),
        onSuccess: (data) => {
            window.open(`/room/${data.roomName}?name=${encodeURIComponent(data.userDisplayName)}`, '_blank');
        },
        onError: (err) => toast.error(err.response?.data?.error || "Odaya bağlanılamadı.")
    });

    const handleReviseSubmit = (e) => {
        e.preventDefault();
        if (!editedAbstract.trim()) return toast.warning("Özet alanı boş bırakılamaz.");
        reviseMutation.mutate(editedAbstract);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleFileUpload = () => {
        if (!file) return toast.warning("Lütfen önce bir PDF dosyası seçin.");
        const formData = new FormData();
        formData.append('file', file);
        uploadMutation.mutate(formData);
    };

    const handlePayment = () => {
        Swal.fire({
            title: 'Ödeme İşlemi',
            text: `${sub?.price || 0} ₺ tutarındaki katılım ücretini ödemeyi onaylıyor musunuz? (Simülasyon)`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ödemeyi Tamamla',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) payMutation.mutate();
        });
    };

    const handleDownloadCertificate = () => {
        window.open(`http://localhost:3000/api/certificates/${submissionId}?token=${localStorage.getItem('token')}`, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Beklemede': return 'text-amber-700 bg-amber-50 border-amber-200'; 
            case 'Revizyon Edildi': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
            case 'Kabul Edildi': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'Reddedildi': return 'text-rose-700 bg-rose-50 border-rose-200';
            case 'Hakem Değerlendirmesinde': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'Revizyon İstendi': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Ödeme Onaylandı': return 'text-teal-700 bg-teal-50 border-teal-200';
            case 'Tam Metin Yüklendi': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'Sunum Yapıldı': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            default: return 'text-slate-600 bg-slate-100 border-slate-300';
        }
    };

    const getProgressStep = (status) => {
        if (['Beklemede', 'Hakem Değerlendirmesinde', 'Revizyon İstendi', 'Revizyon Edildi'].includes(status)) return 1;
        if (status === 'Kabul Edildi') return 2;
        if (status === 'Ödeme Onaylandı') return 3;
        if (status === 'Tam Metin Yüklendi') return 4;
        if (status === 'Sunum Yapıldı') return 5;
        if (status === 'Reddedildi') return 0;
        return 1;
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#F8FAFC]"><span className="text-slate-500 font-medium">Yükleniyor...</span></div>;
    if (error || !sub) return <div className="text-center p-12 text-rose-700 font-medium bg-[#F8FAFC]">Başvuru bulunamadı veya yetkiniz yok. URL'yi kontrol edin.</div>;

    const step = getProgressStep(sub.status);
    const displayStatus = sub.status === 'Tam Metin Yüklendi' ? 'Sunum Bekleniyor' : sub.status;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
            
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="container mx-auto px-6 md:px-12 py-4 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/dashboard/my-submissions')} 
                            className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Çalışmalarıma Dön
                        </button>
                        <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
                        <span className="hidden sm:block text-xs font-semibold text-slate-400 tracking-widest uppercase">
                            Dosya #{sub.id}
                        </span>
                    </div>
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold tracking-wide border ${getStatusColor(sub.status)}`}>
                            {displayStatus}
                        </span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 md:px-12 mt-8 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                <article className="lg:col-span-8">
                    
                    <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 md:p-8 mb-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            {sub.congress_name || "Genel Başvuru"}
                        </p>
                        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-slate-900 leading-tight mb-8">
                            {sub.title}
                        </h1>

                        {sub.status !== 'Reddedildi' && (
                            <div className="relative">
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-100">
                                    <div style={{ width: `${(step / 5) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-slate-900 transition-all duration-500"></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span className={step >= 1 ? 'text-slate-800' : ''}>İnceleme</span>
                                    <span className={step >= 2 ? 'text-slate-800' : ''}>Kabul</span>
                                    <span className={step >= 3 ? 'text-slate-800' : ''}>Kayıt/Ödeme</span>
                                    <span className={step >= 4 ? 'text-slate-800' : ''}>Sunum Bekleniyor</span>
                                    <span className={step >= 5 ? 'text-emerald-600' : ''}>Sunum/Bitiş</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {(!isEditing) && (
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 md:p-8 mb-8">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h2 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">Özet (Abstract)</h2>
                                {sub.status === 'Revizyon İstendi' && (
                                    <button 
                                        onClick={() => { setIsEditing(true); setEditedAbstract(sub.abstract); }}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        ✏️ Metni Düzenle
                                    </button>
                                )}
                            </div>
                            <p className="font-sans text-[16px] text-slate-700 leading-[1.8] text-justify whitespace-pre-wrap">
                                {sub.abstract}
                            </p>
                        </div>
                    )}

                    {isEditing && (
                        <div className="bg-indigo-50/30 border border-indigo-200 rounded-sm shadow-sm p-6 md:p-8 mb-8 ring-4 ring-indigo-50">
                            <h2 className="font-sans text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>✏️</span> Revizyon Modu (Düzeltme)
                            </h2>
                            <form onSubmit={handleReviseSubmit}>
                                <textarea 
                                    value={editedAbstract}
                                    onChange={(e) => setEditedAbstract(e.target.value)}
                                    rows="12"
                                    className="w-full p-4 border border-indigo-200 rounded-sm text-[16px] leading-[1.8] text-slate-800 focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none mb-4 bg-white"
                                    required
                                />
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={reviseMutation.isPending}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-sm text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {reviseMutation.isPending ? 'Gönderiliyor...' : 'Güncelle ve Editöre Gönder'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {(sub.admin_feedback || (sub.reviews && sub.reviews.length > 0)) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-sm shadow-sm p-6 md:p-8 mb-8">
                            <h2 className="font-serif text-lg font-medium text-amber-900 mb-4 border-b border-amber-200/50 pb-2">
                                Kurul Geri Bildirimleri
                            </h2>
                            
                            {sub.admin_feedback && (
                                <div className="mb-6">
                                    <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Editör Notu</h3>
                                    <p className="text-sm text-amber-900 leading-relaxed bg-white/50 p-4 rounded-sm border border-amber-100">
                                        {sub.admin_feedback}
                                    </p>
                                </div>
                            )}

                            {sub.reviews?.map((rev, idx) => (
                                rev.comments && (
                                    <div key={idx} className="mb-4 last:mb-0">
                                        <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Hakem #{idx + 1} Raporu</h3>
                                        <p className="text-sm text-amber-900 leading-relaxed bg-white/50 p-4 rounded-sm border border-amber-100 whitespace-pre-wrap">
                                            {rev.comments}
                                        </p>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                </article>

                <aside className="lg:col-span-4">
                    <div className="sticky top-28 space-y-6">
                        
                        {sub.status === 'Reddedildi' && (
                            <div className="bg-rose-50 border border-rose-200 p-6 rounded-sm shadow-sm text-center">
                                <div className="text-3xl mb-2">❌</div>
                                <h3 className="font-bold text-rose-800 mb-1">Başvuru Reddedildi</h3>
                                <p className="text-xs text-rose-600">Bu çalışma bilim kurulu tarafından uygun bulunmamıştır. Geri bildirimleri inceleyebilirsiniz.</p>
                            </div>
                        )}

                        {sub.status === 'Kabul Edildi' && (
                            <div className="bg-white border-2 border-emerald-500 p-6 rounded-sm shadow-sm">
                                <h3 className="font-bold text-slate-900 text-lg mb-2">Tebrikler! 🎉</h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    Bildiriniz kabul edilmiştir. Kongre programına dahil edilmek ve tam metin yüklemek için katılım ücretini ödemeniz gerekmektedir.
                                </p>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-sm mb-6 border border-slate-200">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kayıt Ücreti</span>
                                    <span className="font-mono text-lg font-bold text-slate-900">{sub.price} ₺</span>
                                </div>
                                <button 
                                    onClick={handlePayment}
                                    disabled={payMutation.isPending}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-sm shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {payMutation.isPending ? 'İşleniyor...' : 'Güvenli Ödeme Yap'}
                                </button>
                            </div>
                        )}

                        {sub.status === 'Ödeme Onaylandı' && (
                            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-2">Tam Metin Yükleme</h3>
                                <p className="text-xs text-slate-500 mb-6">
                                    Ödemeniz onaylandı. Lütfen bildirinizin son hali olan tam metin PDF dosyasını sisteme yükleyiniz.
                                </p>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-slate-300 bg-slate-50 p-4 rounded-sm text-center relative hover:bg-slate-100 transition-colors">
                                        <input 
                                            type="file" 
                                            accept=".pdf" 
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            {file ? (
                                                <span className="text-sm font-semibold text-indigo-700 block truncate">{file.name}</span>
                                            ) : (
                                                <>
                                                    <span className="text-2xl mb-1 block">📄</span>
                                                    <span className="text-xs font-semibold text-slate-600">PDF seçmek için tıklayın</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleFileUpload}
                                        disabled={!file || uploadMutation.isPending}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-sm shadow-sm transition-colors disabled:bg-slate-300"
                                    >
                                        {uploadMutation.isPending ? 'Yükleniyor...' : 'Dosyayı Sisteme Yükle'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {sub.status === 'Tam Metin Yüklendi' && (
                            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-sm shadow-sm text-center">
                                <div className="text-4xl mb-3">🎙️</div>
                                <h3 className="font-bold text-indigo-900 mb-2">Sunuma Hazırsınız</h3>
                                <p className="text-xs text-indigo-700 mb-6">
                                    Dosyalarınız eksiksiz. Kongre günü geldiğinde aşağıdaki butonu kullanarak canlı oturuma katılabilirsiniz.
                                </p>
                                <button 
                                    onClick={() => joinRoomMutation.mutate()}
                                    disabled={!sub.congress_is_session_active || joinRoomMutation.isPending}
                                    className={`w-full font-bold py-3.5 rounded-sm shadow-sm transition-colors flex justify-center items-center gap-2
                                        ${sub.congress_is_session_active 
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {joinRoomMutation.isPending ? 'Bağlanıyor...' : (sub.congress_is_session_active ? 'Canlı Salona Katıl' : 'Oturum Başlamadı')}
                                </button>
                                <p className="text-[10px] text-indigo-500 mt-3 font-semibold">* Sadece kongre yöneticisi oturumu başlattığında aktif olur.</p>
                            </div>
                        )}

                        {sub.presentation_approved && (
                            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-sm shadow-sm text-center">
                                <div className="text-4xl mb-3">🎓</div>
                                <h3 className="font-bold text-emerald-900 mb-2">Tebrikler, Tamamlandı!</h3>
                                <p className="text-xs text-emerald-700 mb-6">
                                    Sunumunuzu başarıyla gerçekleştirdiniz. Katılım sertifikanızı PDF olarak indirebilirsiniz.
                                </p>
                                <button 
                                    onClick={handleDownloadCertificate}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-sm shadow-sm transition-colors flex justify-center items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Sertifikayı İndir
                                </button>
                            </div>
                        )}

                    </div>
                </aside>

            </main>
        </div>
    );
}

export default SubmissionDetailPage;