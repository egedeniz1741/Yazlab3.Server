// src/components/Login.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // API çaðrýlarý için axios kullanýldýðýný varsayalým

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            // ASP.NET API'sine istek gönder
            const response = await axios.post('http://localhost:5054/api/auth/login', { // API adresini kontrol edin
                username: username,
                password: password,
            });

            if (response.data.success) {
                const role = response.data.role;
                alert(`Giris Basarili! Rol: ${role}`);

                // Rolüne göre yönlendirme yap
                if (role === 'admin') {
                    navigate('/admin-panel');
                } else if (role === 'user') {
                    navigate('/user-panel');
                }
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Giriþ hatasý:", error);
            alert("Sunucuya erisimde hata olustu.");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Kargo Sistemine Giris</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Kullanici Adi</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Sifre</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Giriþ Yap
                </button>
            </form>
        </div>
    );
};

export default Login;