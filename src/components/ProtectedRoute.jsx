// src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    // Tarayıcı hafızasında 'token' adında bir şey var mı diye kontrol et.
    const token = localStorage.getItem('token');

    // Eğer token yoksa...
    if (!token) {
        // Kullanıcıyı ana sayfaya (giriş ekranına) geri yönlendir.
        return <Navigate to="/" replace />;
    }

    // Eğer token varsa, hiçbir şey yapma ve içindeki component'in (children)
    // normal şekilde görüntülenmesine izin ver.
    return children;
}

export default ProtectedRoute;