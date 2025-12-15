import { useState, useEffect } from 'react';
import MapDisplay from '../Components/MapDisplay';

// --- TİP TANIMLAMALARI ---
interface DeliveryRoute {
    id: number;
    vehicle: {
        name: string;
        capacityKg: number;
        isRented: boolean;
        rentalCost: number;
        fuelCostPerKm: number;
    };
    totalDistanceKm: number;
    totalCost: number;
    routeDate: string;
    stops: { loadedCargoWeight: number }[];
}

interface Station {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}
// -------------------------

const AdminPanel = () => {
    // --- STATE'LER ---
    const [status, setStatus] = useState("");
    const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
    const [stations, setStations] = useState<Station[]>([]);

    // İstasyon Ekleme Formu için State'ler
    const [newStationName, setNewStationName] = useState("");
    const [newLat, setNewLat] = useState("");
    const [newLng, setNewLng] = useState("");

    // Sayfa açılışında verileri çek
    useEffect(() => {
        fetchRoutes();
        fetchStations();
    }, []);

    // --- VERİ ÇEKME FONKSİYONLARI ---
    const fetchRoutes = async () => {
        try {
            const res = await fetch('http://localhost:5054/api/Optimization/routes');
            if (res.ok) setRoutes(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchStations = async () => {
        try {
            const res = await fetch('http://localhost:5054/api/stations');
            if (res.ok) setStations(await res.json());
        } catch (err) { console.error(err); }
    };

    // --- İŞLEM FONKSİYONLARI ---

    // 1. İSTASYON EKLEME
    const handleAddStation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5054/api/stations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newStationName,
                    latitude: parseFloat(newLat),
                    longitude: parseFloat(newLng)
                })
            });
            if (res.ok) {
                alert("✅ İstasyon başarıyla eklendi.");
                setNewStationName(""); setNewLat(""); setNewLng("");
                fetchStations();
                window.location.reload(); // Haritayı güncellemek için
            }
        } catch (err) { alert("Hata oluştu."); }
    };

    // 2. İSTASYON SİLME
    const handleDeleteStation = async (id: number) => {
        if (!window.confirm("Bu istasyonu silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`http://localhost:5054/api/stations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchStations();
                window.location.reload();
            } else {
                alert("Silinemedi.");
            }
        } catch (err) { alert("Sunucu hatası."); }
    };

    // 3. ROTA HESAPLAMA (ALGORİTMA TETİKLEME)
    const runOptimization = async () => {
        setStatus("⏳ Algoritma çalışıyor, rotalar hesaplanıyor...");
        try {
            const res = await fetch('http://localhost:5054/api/Optimization/plan?useRentedVehicles=true', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setStatus(`✅ ${data.message}`);
                fetchRoutes();
                // Haritayı güncellemek için kısa bir gecikme ile yenileme
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setStatus("❌ " + data.message);
            }
        } catch (err) { setStatus("❌ Sunucu hatası."); }
    };

    // 4. SİSTEMİ SIFIRLAMA
    const resetSystem = async () => {
        if (!window.confirm("TÜM kargolar, rotalar ve kiralık araçlar silinecek. Onaylıyor musunuz?")) return;
        await fetch('http://localhost:5054/api/scenario/reset', { method: 'DELETE' });
        window.location.reload();
    };

    // 5. SENARYO YÜKLEME (1, 2, 3, 4)
    const loadScenario = async (id: number) => {
        if (!window.confirm(`Senaryo ${id} yüklenecek. Mevcut veriler temizlensin mi?`)) return;

        // Önce temizlik yap
        await fetch('http://localhost:5054/api/scenario/reset', { method: 'DELETE' });

        setStatus(`⏳ Senaryo ${id} verileri yükleniyor...`);
        try {
            const res = await fetch(`http://localhost:5054/api/scenario/${id}`, { method: 'POST' });
            if (res.ok) {
                setStatus(`✅ Senaryo ${id} yüklendi! Lütfen 'Hesapla' butonuna basın.`);
            } else {
                setStatus("❌ Senaryo yüklenemedi.");
            }
        } catch (err) { setStatus("❌ Sunucu hatası."); }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>

            {/* --- ÜST KONTROL PANELİ --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Yönetici Kontrol Paneli</h2>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

                    {/* Senaryo Butonları */}
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {[1, 2, 3, 4].map(num => (
                            <button
                                key={num}
                                onClick={() => loadScenario(num)}
                                style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: '0.2s' }}
                                title={`Senaryo ${num}'ü Yükle`}
                            >
                                Senaryo {num}
                            </button>
                        ))}
                    </div>

                    <div style={{ width: '1px', height: '30px', backgroundColor: '#ddd' }}></div>

                    {/* Ana Aksiyonlar */}
                    <div style={{ gap: '10px', display: 'flex' }}>
                        <button onClick={resetSystem} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                            🗑️ Temizle
                        </button>
                        <button onClick={runOptimization} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                            🚀 Hesapla
                        </button>
                    </div>
                </div>
            </div>

            {/* Durum Mesajı Çubuğu */}
            {status && <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', border: '1px solid #c3e6cb', textAlign: 'center', fontWeight: '500' }}>{status}</div>}

            {/* --- ANA İÇERİK (HARİTA ve PANELLER) --- */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* SOL: HARİTA ALANI */}
                <div style={{ flex: 2, minWidth: '600px', border: '1px solid #e0e0e0', height: '650px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <MapDisplay />
                </div>

                {/* SAĞ: YÖNETİM ve TABLO ALANI */}
                <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 1. İSTASYON YÖNETİMİ */}
                    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#34495e', borderBottom: '2px solid #f1f1f1', paddingBottom: '10px' }}>📍 İstasyon Yönetimi</h3>

                        {/* Ekleme Formu */}
                        <form onSubmit={handleAddStation} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            <input placeholder="İlçe Adı" value={newStationName} onChange={e => setNewStationName(e.target.value)} required style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input placeholder="Lat (40.xx)" type="number" step="any" value={newLat} onChange={e => setNewLat(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
                                <input placeholder="Lng (29.xx)" type="number" step="any" value={newLng} onChange={e => setNewLng(e.target.value)} required style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} />
                            </div>
                            <button type="submit" style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Ekle</button>
                        </form>

                        {/* İstasyon Listesi */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #f1f1f1', borderRadius: '6px', padding: '5px' }}>
                            {stations.map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f9f9f9', fontSize: '14px' }}>
                                    <span style={{ fontWeight: '500' }}>{s.name}</span>
                                    <button onClick={() => handleDeleteStation(s.id)} style={{ backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px', fontSize: '12px' }}>Sil</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. MALİYET ANALİZİ TABLOSU */}
                    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', flex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#34495e', borderBottom: '2px solid #f1f1f1', paddingBottom: '10px' }}>📊 Maliyet Analizi</h3>

                        {routes.length === 0 ? (
                            <p style={{ color: '#95a5a6', fontStyle: 'italic', textAlign: 'center' }}>Hesaplanmış rota bulunamadı.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left', color: '#7f8c8d' }}>
                                            <th style={{ padding: '10px' }}>Araç</th>
                                            <th style={{ padding: '10px' }}>Yük / Kap.</th>
                                            <th style={{ padding: '10px' }}>Mesafe</th>
                                            <th style={{ padding: '10px' }}>Toplam</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.map(r => {
                                            const totalLoad = r.stops.reduce((sum, s) => sum + s.loadedCargoWeight, 0);
                                            const rentCost = r.vehicle.rentalCost;
                                            

                                            return (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                                        {r.vehicle.name}
                                                        {/* Kiralık Araç Etiketi */}
                                                        {r.vehicle.isRented && (
                                                            <div style={{ fontSize: '10px', color: '#e67e22', marginTop: '2px' }}>Kiralık ({rentCost} TL)</div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px' }}>
                                                        {totalLoad} / {r.vehicle.capacityKg} kg
                                                        <div style={{ width: '100%', backgroundColor: '#eee', height: '4px', marginTop: '5px', borderRadius: '2px' }}>
                                                            <div style={{ width: `${(totalLoad / r.vehicle.capacityKg) * 100}%`, backgroundColor: '#3498db', height: '100%', borderRadius: '2px' }}></div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px' }}>{r.totalDistanceKm.toFixed(1)} km</td>
                                                    <td style={{ padding: '10px', color: '#27ae60', fontWeight: 'bold' }}>{r.totalCost.toFixed(2)} TL</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminPanel;