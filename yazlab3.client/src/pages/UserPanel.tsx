import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için gerekli
import MapDisplay from '../Components/MapDisplay';

interface Station { id: number; name: string; }
interface MyCargo { id: number; targetStation: string; cargoCount: number; weightKg: number; date: string; status: string; }

const UserPanel = () => {
    const navigate = useNavigate(); // Hook'u tanımla

    const [stations, setStations] = useState<Station[]>([]);
    const [myCargos, setMyCargos] = useState<MyCargo[]>([]);
    const [selectedStationId, setSelectedStationId] = useState<number | string>("");
    const [cargoCount, setCargoCount] = useState(0);
    const [weight, setWeight] = useState(0);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // İstasyonları Çek
        fetch('http://localhost:5054/api/stations').then(res => res.json()).then(data => setStations(data));

        // Kargolarımı Çek
        fetchMyCargos();
    }, []);

    const fetchMyCargos = () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            fetch(`http://localhost:5054/api/CargoRequests/user/${userId}`)
                .then(res => res.json())
                .then(data => setMyCargos(data))
                .catch(err => console.error(err));
        } else {
            // Eğer ID yoksa direkt login'e at
            navigate('/');
        }
    };

    const handleAddCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        const storedUserId = localStorage.getItem("userId");
        if (!storedUserId) {
            setMessage("❌ Oturum süresi dolmuş.");
            setTimeout(() => navigate('/'), 2000);
            return;
        }

        if (!selectedStationId || cargoCount <= 0 || weight <= 0) {
            setMessage("⚠️ Lütfen tüm alanları doldurun.");
            return;
        }

        const newRequest = {
            userId: Number(storedUserId),
            targetStationId: Number(selectedStationId),
            cargoCount: Number(cargoCount),
            weightKg: Number(weight),
            deliveryDate: new Date().toISOString(),
            isProcessed: false
        };

        try {
            const response = await fetch('http://localhost:5054/api/cargorequests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRequest)
            });

            if (response.ok) {
                setMessage("✅ Kargo talebi alındı!");
                setIsSuccess(true);
                setCargoCount(0); setWeight(0); setSelectedStationId("");
                fetchMyCargos(); // Listeyi anında güncelle
            } else {
                setMessage("❌ Hata oluştu.");
            }
        } catch (error) { setMessage("❌ Sunucu hatası."); }
    };

    // --- ÇIKIŞ YAP FONKSİYONU ---
    const handleLogout = () => {
        if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
            // Hafızayı temizle
            localStorage.removeItem("userId");
            localStorage.removeItem("userRole");
            localStorage.removeItem("username");

            // Login'e gönder
            navigate('/');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'row', backgroundColor: '#f4f6f9' }}>

            {/* SOL: İŞLEM PANELİ */}
            <div style={{ width: '400px', padding: '30px', backgroundColor: '#fff', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '25px', overflowY: 'auto' }}>

                {/* Başlık ve Hoşgeldin Mesajı */}
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <h2 style={{ margin: '0', color: '#2c3e50' }}>Kullanıcı Paneli</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Hoşgeldiniz, kargo işlemlerinizi buradan yönetebilirsiniz.</p>
                </div>

                {/* 1. Kargo Ekleme Formu */}
                <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>📦 Yeni Kargo Gönder</h4>
                    <form onSubmit={handleAddCargo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Hedef İstasyon:</label>
                            <select style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} value={selectedStationId} onChange={(e) => setSelectedStationId(e.target.value)}>
                                <option value="">Seçiniz...</option>
                                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Adet:</label>
                                <input type="number" min="1" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} value={cargoCount || ''} onChange={(e) => setCargoCount(Number(e.target.value))} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Ağırlık (kg):</label>
                                <input type="number" min="1" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} value={weight || ''} onChange={(e) => setWeight(Number(e.target.value))} />
                            </div>
                        </div>
                        <button type="submit" style={{ padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>Talebi Gönder</button>
                    </form>
                    {message && <div style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', backgroundColor: isSuccess ? '#d4edda' : '#f8d7da', color: isSuccess ? '#155724' : '#721c24', fontSize: '13px', textAlign: 'center' }}>{message}</div>}
                </div>

                {/* 2. Geçmiş Kargolar Listesi */}
                <div style={{ flex: 1, minHeight: '200px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>📋 Geçmiş Gönderilerim</h4>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '10px' }}>
                        {myCargos.length === 0 ? <p style={{ padding: '20px', color: '#999', textAlign: 'center', fontSize: '13px' }}>Henüz kargo kaydınız yok.</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', textAlign: 'left', color: '#7f8c8d', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Hedef</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Detay</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myCargos.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.targetStation}</td>
                                            <td style={{ padding: '10px' }}>{c.weightKg} kg <br /><span style={{ color: '#999' }}>({c.cargoCount} ad)</span></td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block',
                                                    backgroundColor: c.status.includes("Yolda") ? '#d4edda' : '#fff3cd',
                                                    color: c.status.includes("Yolda") ? '#155724' : '#856404'
                                                }}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* ÇIKIŞ BUTONU (EN ALTTA) */}
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: 'auto', padding: '12px', backgroundColor: '#e74c3c', color: 'white',
                        border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                >
                    🚪 Güvenli Çıkış Yap
                </button>

            </div>

            {/* SAĞ: HARİTA */}
            <div style={{ flex: 1, padding: '20px' }}>
                <div style={{ height: '100%', border: '2px solid #ddd', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <MapDisplay />
                </div>
            </div>
        </div>
    );
};

export default UserPanel;