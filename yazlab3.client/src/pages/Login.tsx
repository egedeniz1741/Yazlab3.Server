import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    // Form verileri için state'ler
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // UI durumu için state'ler
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Sayfa yenilenmesini engelle
        setError('');
        setIsLoading(true);

        try {
            // Backend'e istek atıyoruz (DTO yapısına uygun JSON gönderiyoruz)
            const response = await fetch('http://localhost:5054/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            // Gelen cevabı oku
            const data = await response.json();

            if (response.ok && data.success) {
                // BAŞARILI: Verileri tarayıcıya kaydet
                localStorage.setItem("userId", data.id);
                localStorage.setItem("userRole", data.role);
                localStorage.setItem("username", data.username);

                console.log("Giriş Başarılı! ID:", data.id, "Rol:", data.role);

                // Yönlendirme
                if (data.role === 'admin') {
                    navigate('/admin-panel');
                } else {
                    navigate('/user-panel');
                }
            } else {
                // BAŞARISIZ: Backend'den gelen hata mesajını göster
                setError(data.message || 'Giriş başarısız.');
            }
        } catch (err) {
            console.error(err);
            setError('Sunucuya bağlanılamadı. Backend çalışıyor mu?');
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
            backgroundColor: '#f0f2f5'
        }}>
            <div style={{
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: '350px',
                textAlign: 'center'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Kargo Sistemi</h2>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    <input
                        type="text"
                        placeholder="Kullanıcı Adı (admin / musteri)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />

                    <input
                        type="password"
                        placeholder="Şifre (123)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            padding: '12px',
                            backgroundColor: isLoading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>

                </form>

                {error && (
                    <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;