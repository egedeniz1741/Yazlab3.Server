import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5054/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem("userId", data.id);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("username", data.username);

                if (data.role === 'admin') {
                    navigate('/admin-panel');
                } else {
                    navigate('/user-panel');
                }
            } else {
                setError(data.message || 'Giriş başarısız.');
            }
        } catch (err) {
            setError('Sunucuya bağlanılamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea, #764ba2)'
        }}>
            <div style={{
                padding: '45px 40px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                width: '360px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    marginBottom: '8px',
                    color: '#333',
                    fontSize: '26px',
                    fontWeight: '700'
                }}>
                    🚚 Kargo Sistemi Uygulamasına Hoşgeldiniz
                </h1>

                <p style={{
                    marginBottom: '30px',
                    color: '#777',
                    fontSize: '14px'
                }}>
                    Lütfen hesabınıza giriş yapın
                </p>

                <form
                    onSubmit={handleLogin}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    <input
                        type="text"
                        placeholder="Kullanıcı Adı"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />

                    <input
                        type="password"
                        placeholder="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '14px',
                            borderRadius: '10px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: '10px',
                            padding: '14px',
                            background: isLoading
                                ? '#b0b0b0'
                                : 'linear-gradient(135deg, #667eea, #5a67d8)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                {error && (
                    <div style={{
                        marginTop: '20px',
                        padding: '12px',
                        backgroundColor: '#fdecea',
                        color: '#d32f2f',
                        borderRadius: '8px',
                        fontSize: '13px'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
