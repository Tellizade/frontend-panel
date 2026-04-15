// src/App.jsx

import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 

function App() {
  return (
    <div>
      <Navbar />

      {/* Bildirimlerin gösterileceği konteyner */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;