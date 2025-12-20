import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddNewUser = () => {
    const navigate = useNavigate();

    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");

    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        if (!username || !password) {
            setMessage("Kullanıcı adı ve şifre zorunludur.");
            return;
        }

        try {
            const res = await fetch('/api/Users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: role
                })
            });

            if (res.ok) {
                setIsSuccess(true);
                setMessage(" Kullanıcı başarıyla oluşturuldu!");
                setUsername("");
                setPassword("");
                setRole("user");
            } else {
                setMessage(" Hata: Kayıt yapılamadı.");
            }
        } catch (err) {
            setMessage(" Sunucu hatası.");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}> Yeni Kullanıcı</h2>
                    <button onClick={() => navigate('/admin-panel')} style={styles.backButton}>⬅ Geri</button>
                </div>

                <p style={{ color: '#bdc3c7', fontSize: '13px', marginBottom: '20px' }}>Sisteme yeni kullanıcı ekle.</p>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    <div>
                        <label style={styles.label}>Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div>
                        <label style={styles.label}>Şifre</label>
                        <input
                            type="text"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </div>

                    <div>
                        <label style={styles.label}>Rol</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            style={styles.select}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button type="submit" style={styles.saveButton}>💾 Kaydet</button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        borderRadius: '6px',
                        backgroundColor: isSuccess ? '#2ecc71' : '#e74c3c',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};


const styles: { [key: string]: React.CSSProperties } = {
    container: {
      
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2c3e50, #4ca1af)',
        fontFamily: "'Segoe UI', sans-serif"
    },
    formBox: {
        width: '100%',
        maxWidth: '400px', 
        padding: '30px',
        backgroundColor: '#34495e',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid #465f75',
        boxSizing: 'border-box' 
    },
    label: {
        display: 'block', color: '#ecf0f1', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px'
    },
    input: {
        width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #576d7e',
        backgroundColor: '#2c3e50', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box'
    },
    select: {
        width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #576d7e',
        backgroundColor: '#2c3e50', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box'
    },
    saveButton: {
        width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none',
        borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
        transition: '0.3s'
    },
    backButton: {
        padding: '5px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none',
        borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
    }
};

export default AddNewUser;