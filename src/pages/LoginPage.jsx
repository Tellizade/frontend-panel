// src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';

function LoginPage() {
    // Aktif sekmeyi takip etmek için state ('login' veya 'register')
    const [activeTab, setActiveTab] = useState('login'); 

    // Giriş formu için state'ler
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Kayıt formu için state'ler
    const [registerData, setRegisterData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        title: '',
        institution: '',
        role: 'academician', // Varsayılan rol
    });

    const navigate = useNavigate();

    // Giriş yapma fonksiyonu (küçük güncellemelerle)
    const handleLogin = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.post('/login', {
                email: loginEmail,
                password: loginPassword,
            });
            const token = response.data.token;
            localStorage.setItem('token', token);
            toast.success('Giriş başarılı! Ana panele yönlendiriliyorsunuz...');
            setTimeout(() => { navigate('/dashboard'); }, 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Sunucuya ulaşılamıyor.';
            toast.error(errorMessage);
        }
    };

    // --- YENİ KAYIT OLMA FONKSİYONU ---
    const handleRegister = async (event) => {
        event.preventDefault();
        try {
            // Backend'e gönderilecek veriyi hazırlıyoruz (rolü bir dizi içine alıyoruz)
            const payload = {
                ...registerData,
                roles: [registerData.role] // Backend dizi bekliyor
            };
            delete payload.role; // Artık 'role' anahtarına gerek yok

            await apiClient.post('/register', payload); // Sadece '/register'yazdık
            
            toast.success('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            setActiveTab('login'); // Kullanıcıyı giriş sekmesine yönlendir

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Kayıt sırasında bir hata oluştu.';
            toast.error(errorMessage);
        }
    };

    // Kayıt formundaki değişiklikleri state'e yansıtan fonksiyon
    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
    };
    // ------------------------------------

    // Form inputları için ortak Tailwind sınıfları
    const inputClasses = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
                {/* Sekme Butonları */}
                <div className="flex border-b mb-6">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`py-2 px-4 w-1/2 text-center font-semibold ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Giriş Yap
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`py-2 px-4 w-1/2 text-center font-semibold ${activeTab === 'register' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Kayıt Ol
                    </button>
                </div>

                {/* Aktif sekmeye göre formu göster */}
                {activeTab === 'login' ? (
                    // --- GİRİŞ FORMU ---
                    <form onSubmit={handleLogin}>
                        <h2 className="text-2xl font-bold text-center mb-6">Yönetici Girişi</h2>
                        <div className="mb-4">
                            <label htmlFor="loginEmail" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input type="email" id="loginEmail" className={inputClasses} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="loginPassword" className="block text-gray-700 text-sm font-bold mb-2">Şifre</label>
                            <input type="password" id="loginPassword" className={inputClasses} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Giriş Yap
                        </button>
                    </form>
                ) : (
                    // --- KAYIT FORMU ---
                    <form onSubmit={handleRegister} className="space-y-4">
                         <h2 className="text-2xl font-bold text-center mb-6">Yeni Hesap Oluştur</h2>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Ad</label>
                            <input name="firstName" className={inputClasses} value={registerData.firstName} onChange={handleRegisterChange} required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Soyad</label>
                            <input name="lastName" className={inputClasses} value={registerData.lastName} onChange={handleRegisterChange} required />
                        </div>
                         <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input name="email" type="email" className={inputClasses} value={registerData.email} onChange={handleRegisterChange} required />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Şifre</label>
                            <input name="password" type="password" className={inputClasses} value={registerData.password} onChange={handleRegisterChange} required />
                        </div>
                         <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Unvan</label>
                            <input name="title" className={inputClasses} value={registerData.title} onChange={handleRegisterChange} />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Kurum</label>
                            <input name="institution" className={inputClasses} value={registerData.institution} onChange={handleRegisterChange} />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Hesap Türü</label>
                            <select name="role" value={registerData.role} onChange={handleRegisterChange} className={inputClasses}>
                                <option value="academician">Akademisyen</option>
                                <option value="reviewer">Hakem</option>
                                {/* <option value="admin">Yönetici</option> // TODO: Yönetici rolü eklenebilir */}
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Kayıt Ol
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default LoginPage;