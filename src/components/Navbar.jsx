// src/components/Navbar.jsx

import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    let user = null;

    if (token) {
        try {
            user = jwtDecode(token);
        } catch (error) {
            console.error("Geçersiz token:", error);
            localStorage.removeItem('token');
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const baseLinkClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    const inactiveLinkClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";
    const activeLinkClasses = "bg-gray-900 text-white";

    return (
        <nav className="bg-gray-800 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <NavLink to={user ? "/dashboard" : "/"} className="text-white text-xl font-bold">
                            Akademik Platform
                        </NavLink>
                    </div>

                    {user && (
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <NavLink 
                                        to="/dashboard" 
                                        end
                                        className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                                    >
                                        Ana Panel
                                    </NavLink>
                                    
                                    {/* ----- DÜZELTME BURADA: 'to' ADRESİ DOĞRU YERE GİDİYOR ----- */}
                                    <NavLink 
                                        to="/dashboard/congresses/new"
                                        className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                                    >
                                        + Yeni Kongre
                                    </NavLink>
                                    {/* -------------------------------------------------------- */}

                                    {user.roles.includes('academician') && (
                                        <NavLink 
                                            to="/dashboard/my-submissions" 
                                            className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                                        >
                                            Başvurularım
                                        </NavLink>
                                    )}

                                    {user.roles.includes('reviewer') && (
                                        <NavLink 
                                            to="/dashboard/my-reviews" 
                                            className={({ isActive }) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                                        >
                                            Değerlendirmelerim
                                        </NavLink>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center ml-6">
                                <span className="text-gray-400 text-sm mr-4">
                                    Hoş geldin, {user.email}
                                </span>
                                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md text-sm transition-colors duration-200">
                                    Çıkış Yap
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;