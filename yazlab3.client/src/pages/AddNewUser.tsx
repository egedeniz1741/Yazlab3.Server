// src/pages/AddNewUser.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddNewUser = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('User');

    const handleGoBack = () => {
        navigate('/admin-panel');
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            alert('Kullanıcı Adı ve Şifre boş bırakılamaz.');
            return;
        }

        const newUser = { username, password, role };

        try {
            const response = await axios.post(
                'http://localhost:5054/api/User',
                newUser
            );

            if (response.status === 201 || response.status === 200) {
                alert(`✅ Kullanıcı başarıyla eklendi! Rol: ${role}`);
                setUsername('');
                setPassword('');
                setRole('User');
            }
        } catch (error: any) {
            const msg =
                error.response?.data?.message ||
                'Sunucuya erişimde hata oluştu.';
            alert(`❌ Hata: ${msg}`);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                {/* HEADER */}
                <div style={headerStyle}>
                    <div>
                        <h2 style={titleStyle}>👤 Yeni Kullanıcı</h2>
                        <p style={subtitleStyle}>Sisteme yeni kullanıcı ekle</p>
                    </div>

                    <button onClick={handleGoBack} style={backButtonStyle}>
                        ⬅️ Geri
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleAddUser} style={formStyle}>
                    <div>
                        <label style={labelStyle}>Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={inputStyle}
                            placeholder="örn: berke123"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="User">User (Standart)</option>
                            <option value="Admin">Admin (Yönetici)</option>
                        </select>
                    </div>

                    <button type="submit" style={saveButtonStyle}>
                        💾 Kullanıcıyı Kaydet
                    </button>
                </form>
            </div>
        </div>
    );
};

/* -------------------- STYLES -------------------- */

const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
};

const cardStyle: React.CSSProperties = {
    width: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '35px 30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#2d3748',
};

const subtitleStyle: React.CSSProperties = {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#718096',
};

const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4a5568',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
};

const saveButtonStyle: React.CSSProperties = {
    marginTop: '10px',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea, #5a67d8)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
};

const backButtonStyle: React.CSSProperties = {
    padding: '8px 14px',
    backgroundColor: '#edf2f7',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
};

export default AddNewUser;
