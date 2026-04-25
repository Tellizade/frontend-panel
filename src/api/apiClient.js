// src/api/apiClient.js

import axios from 'axios';

// Üretim: VITE_API_BASE_URL (örn. https://xxx.run.app/api). Geliştirme: localhost.
const baseURL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`,
});

// Bu "interceptor", bizim postacımızın (axios) mektubu göndermeden hemen önce
// araya girip, mektuba damga (token) yapıştırmasını sağlar.
apiClient.interceptors.request.use(
    (config) => {
        // Tarayıcı hafızasından token'ı al.
        const token = localStorage.getItem('token');
        // Eğer token varsa...
        if (token) {
            // İstek başlığına (headers) 'Authorization' bilgisini ekle.
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;