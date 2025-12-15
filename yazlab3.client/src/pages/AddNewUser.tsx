// src/pages/AddNewUser.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // API çağrıları için axios kullanıyoruz

const AddNewUser = () => {
    const navigate = useNavigate();

    // Form state'leri
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('User'); // Varsayılan olarak User

    // --- BUTON FONKSİYONLARI ---

    const handleGoBack = () => {
        // Admin Panel ana sayfasına geri dön
        navigate('/admin-panel');
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validasyon
        if (!username || !password) {
            alert('Kullanıcı Adı ve Şifre boş bırakılamaz.');
            return;
        }

        const newUser = {
            username,
            password,
            role,
            // CreatedDate backend tarafından otomatik eklenecek, buraya yazmıyoruz.
        };

        try {
            // API'ye POST isteği gönder (Yeni UserController'ı hedefliyoruz)
            const apiUrl = 'http://localhost:5054/api/User';

            // Gerçek projede burada Admin yetkisi gerektiren bir token gönderilmelidir.
            const response = await axios.post(apiUrl, newUser);

            if (response.status === 201 || response.status === 200) {
                alert(`✅ Kullanıcı başarıyla eklendi! Rol: ${role}`);
                // Formu temizle
                setUsername('');
                setPassword('');
                setRole('User');
            } else {
                alert(`Hata: ${response.data.message || 'Kullanıcı eklenemedi.'}`);
            }

        } catch (error: any) {
            console.error("Kullanıcı ekleme hatası:", error);
            // Backend'den gelen hata mesajını göster
            const errorMessage = error.response?.data?.message || "Sunucuya erişimde veya ekleme işleminde hata oluştu.";
            alert(`❌ Hata: ${errorMessage}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f1f1', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#34495e' }}>👤 Yeni Kullanıcı Ekle</h2>

                {/* Geri Dön Butonu */}
                <button
                    onClick={handleGoBack}
                    style={{ padding: '8px 15px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                    ⬅️ Geri Dön
                </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* Kullanıcı Adı */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Kullanıcı Adı</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                {/* Şifre */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Şifre</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                {/* Rol (Combobox) */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rol Seçimi</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="User">User (Standart Kullanıcı)</option>
                        <option value="Admin">Admin (Yönetici)</option>
                    </select>
                </div>

                {/* Ekle Butonu */}
                <button
                    type="submit"
                    style={{ padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginTop: '10px' }}
                >
                    Kullanıcıyı Kaydet
                </button>
            </form>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    borderRadius: '6px',
};

export default AddNewUser;