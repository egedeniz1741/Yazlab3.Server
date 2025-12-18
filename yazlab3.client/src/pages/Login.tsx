import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            if (username === 'admin' && password === 'admin') {
                localStorage.setItem("userRole", "admin");
                localStorage.setItem("userId", "1");
                navigate('/admin-panel');
            } else if (username === 'ahmet' && password === '123') {
                localStorage.setItem("userRole", "user");
                localStorage.setItem("userId", "2");
                navigate('/user-panel');
            } else if (username === 'mehmet' && password === '123') {
                localStorage.setItem("userRole", "user");
                localStorage.setItem("userId", "3");
                navigate('/user-panel');
            } else {
                setError('Hatalı kullanıcı adı veya şifre!');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div style={styles.container}>
            {/* Arka Plan Katmanı */}
            <div style={styles.overlay}></div>

            <div style={styles.loginBox}>
                <div style={styles.header}>
                    <div style={styles.logoCircle}>🚛</div>
                    <h2 style={styles.title}>Lojistik Yönetim Paneli</h2>
            
                </div>

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Kullanıcı Adı</label>
                        <input
                            type="text"
                          
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Şifre</label>
                        <input
                            type="password"
                          
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    {error && <div style={styles.errorMessage}>{error}</div>}

                    <button
                        type="submit"
                        style={styles.button}
                        disabled={isLoading}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
                    >
                        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <div style={styles.footer}>
                    <p>Kocaeli Üniversitesi Yazılım Laboratuvarı 3</p>
                </div>
            </div>
        </div>
    );
};

// --- STYLES (DÜZELTİLMİŞ) ---
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        // --- BU KISIM DEĞİŞTİ (TAM EKRAN GARANTİSİ) ---
        position: 'fixed', // Sayfa akışından bağımsız, ekrana sabitler
        top: 0,
        left: 0,
        width: '100vw',  // Ekran genişliğinin %100'ü
        height: '100vh', // Ekran yüksekliğinin %100'ü
        margin: 0,
        padding: 0,
        zIndex: 9999, // Her şeyin üstünde olsun
        // ----------------------------------------------
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Karartma oranı
        zIndex: -1, // İçeriğin arkasında kalması için
    },
    loginBox: {
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Saydamlık artırıldı
        padding: '40px',
        borderRadius: '16px', // Köşeler daha yuvarlak
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', // Modern gölge
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        backdropFilter: 'blur(8px)', // Buzlu cam efekti
        border: '1px solid rgba(255, 255, 255, 0.18)', // İnce çerçeve
    },
    header: {
        marginBottom: '30px',
    },
    logoCircle: {
        width: '64px',
        height: '64px',
        background: 'linear-gradient(135deg, #3498db, #2980b9)', // Gradient arka plan
        color: 'white',
        fontSize: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        margin: '0 auto 15px auto',
        boxShadow: '0 4px 15px rgba(52, 152, 219, 0.5)',
    },
    title: {
        margin: '0 0 8px 0',
        color: '#2c3e50',
        fontSize: '24px',
        fontWeight: 'bold',
    },
    subtitle: {
        margin: 0,
        color: '#7f8c8d',
        fontSize: '14px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        textAlign: 'left',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#34495e',
    },
    input: {
        width: '100%',
        padding: '12px 15px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        transition: 'all 0.3s ease',
        outline: 'none',
        boxSizing: 'border-box',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        border: '1px solid #ffcdd2',
    },
    button: {
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(to right, #3498db, #2980b9)', // Butona da gradient
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)',
        transition: 'transform 0.2s',
    },
    footer: {
        marginTop: '25px',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        paddingTop: '15px',
        fontSize: '11px',
        color: '#7f8c8d',
    }
};

export default Login;