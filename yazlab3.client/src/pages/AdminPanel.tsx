import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapDisplay from '../Components/MapDisplay';

// --- TİP TANIMLAMALARI ---
interface Station { id: number; name: string; latitude: number; longitude: number; }

interface StopDetail {
    id: number;
    visitOrder: number;
    loadedCargoWeight: number;
    stationName: string;
    customers: string[];
    station: Station; // Harita için zorunlu alan
}

interface Vehicle {
    name: string;
    capacityKg: number;
    isRented: boolean;
    rentalCost: number;
    fuelCostPerKm: number;
}

interface DeliveryRoute {
    id: number;
    vehicle: Vehicle;
    totalDistanceKm: number;
    totalCost: number;
    stops: StopDetail[];
}

const AdminPanel = () => {
    const navigate = useNavigate();

    // --- STATE'LER ---
    const [status, setStatus] = useState("");
    const [allRoutes, setAllRoutes] = useState<DeliveryRoute[]>([]);
    const [filteredRoutes, setFilteredRoutes] = useState<DeliveryRoute[]>([]);
    const [stations, setStations] = useState<Station[]>([]);

    // Geçmiş Kayıtlar Modu
    const [showHistory, setShowHistory] = useState(false);

    // Filtreleme
    const [selectedVehicle, setSelectedVehicle] = useState("all");
    const [searchCustomer, setSearchCustomer] = useState("");

    // Modallar
    const [showSummary, setShowSummary] = useState(false);
    const [showMatrix, setShowMatrix] = useState(false);
    const [matrixData, setMatrixData] = useState<any>(null);

    // Form
    const [newStationName, setNewStationName] = useState("");
    const [newLat, setNewLat] = useState("");
    const [newLng, setNewLng] = useState("");

    // VERİLERİ ÇEK
    useEffect(() => {
        fetchRoutes();
        fetchStations();
    }, [showHistory]); // showHistory değişince (Geçmiş/Aktif) veriyi tekrar çek

    // FİLTRELEME MANTIĞI
    useEffect(() => {
        let result = allRoutes;

        // Araç Filtresi
        if (selectedVehicle !== "all") {
            result = result.filter(r => r.vehicle.name === selectedVehicle);
        }

        // Müşteri Filtresi
        if (searchCustomer.trim() !== "") {
            const term = searchCustomer.toLowerCase();
            result = result.filter(r =>
                r.stops.some(stop =>
                    stop.customers && stop.customers.some(c => c.toLowerCase().includes(term))
                )
            );
        }

        setFilteredRoutes(result);
    }, [selectedVehicle, searchCustomer, allRoutes]);

    // --- API ÇAĞRILARI ---
    const fetchRoutes = async () => {
        try {
            // Backend'e "?showHistory=true" veya "false" gönderiyoruz
            const url = showHistory ? '/api/Optimization/routes?showHistory=true' : '/api/Optimization/routes';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAllRoutes(data);
                setFilteredRoutes(data);
            }
        } catch (err) { console.error(err); }
    };

    const fetchStations = async () => {
        try { const res = await fetch('/api/stations'); if (res.ok) setStations(await res.json()); } catch (err) { }
    };

    const fetchMatrix = async () => {
        try { const res = await fetch('/api/stations/matrix'); if (res.ok) { setMatrixData(await res.json()); setShowMatrix(true); } } catch { alert("Hata."); }
    };

    // --- İŞLEMLER ---
    const handleAddStation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/stations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newStationName, latitude: parseFloat(newLat), longitude: parseFloat(newLng) })
            });
            if (res.ok) { alert("✅ Eklendi."); setNewStationName(""); setNewLat(""); setNewLng(""); fetchStations(); window.location.reload(); }
        } catch (err) { alert("Hata."); }
    };

    const handleDeleteStation = async (id: number) => {
        if (!window.confirm("Silinsin mi?")) return;
        try { const res = await fetch(`/api/stations/${id}`, { method: 'DELETE' }); if (res.ok) { fetchStations(); window.location.reload(); } } catch { alert("Hata."); }
    };

    const runOptimization = async () => {
        setStatus("⏳ Hesaplanıyor...");
        try {
            const res = await fetch('/api/Optimization/plan?useRentedVehicles=true', { method: 'POST' });
            const data = await res.json();
            if (res.ok) { setStatus(`✅ ${data.message}`); fetchRoutes(); setTimeout(() => window.location.reload(), 1500); }
            else { setStatus("❌ " + data.message); }
        } catch { setStatus("❌ Sunucu Hatası"); }
    };

    const resetSystem = async () => {
        if (!window.confirm("Mevcut rotalar arşivlenecek ve harita temizlenecek. Onaylıyor musunuz?")) return;
        await fetch('/api/scenario/reset', { method: 'DELETE' });
        window.location.reload();
    };

    const loadScenario = async (id: number) => {
        if (!window.confirm(`Senaryo ${id} yüklenecek.`)) return;
        await fetch('/api/scenario/reset', { method: 'DELETE' });
        setStatus(`⏳ Senaryo ${id} Yükleniyor...`);
        try {
            const res = await fetch(`/api/scenario/${id}`, { method: 'POST' });
            if (res.ok) setStatus(`✅ Senaryo ${id} Hazır!`);
        } catch { setStatus("❌ Hata."); }
    };

    // İstatistikler
    const calculateStats = () => {
        const totalCost = allRoutes.reduce((acc, r) => acc + r.totalCost, 0);
        const totalDist = allRoutes.reduce((acc, r) => acc + r.totalDistanceKm, 0);
        const totalCargo = allRoutes.reduce((acc, r) => acc + r.stops.reduce((s, stop) => s + stop.loadedCargoWeight, 0), 0);
        const rentedCount = allRoutes.filter(r => r.vehicle.isRented).length;
        const ownedCount = allRoutes.length - rentedCount;
        return { totalCost, totalDist, totalCargo, rentedCount, ownedCount };
    };
    const stats = calculateStats();
    const vehicleNames = [...new Set(allRoutes.map(r => r.vehicle.name))];

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f4f6f9', minHeight: '100vh', position: 'relative' }}>

            {/* ÜST PANEL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Yönetici Paneli</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>{[1, 2, 3, 4].map(num => (<button key={num} onClick={() => loadScenario(num)} style={{ padding: '6px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>S{num}</button>))}</div>
                    <div style={{ width: '1px', height: '25px', backgroundColor: '#ddd' }}></div>

                    {/* YENİ: GEÇMİŞ / AKTİF BUTONU */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        style={{ padding: '8px 15px', backgroundColor: showHistory ? '#34495e' : '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {showHistory ? '📂 Aktife Dön' : '📜 Geçmiş'}
                    </button>

                    <button onClick={resetSystem} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Temizle</button>
                    <button onClick={runOptimization} style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hesapla</button>
                    <button onClick={() => setShowSummary(true)} style={{ padding: '8px 15px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Özet</button>
                    <button onClick={fetchMatrix} style={{ padding: '8px 15px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📏 Mesafeler</button>

                    <div style={{ width: '1px', height: '25px', backgroundColor: '#ddd' }}></div>
                    <button onClick={() => navigate('/admin-panel/add-user')} style={{ padding: '8px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>➕ Kullanıcı</button>
                    <button onClick={() => navigate('/')} style={{ padding: '8px 15px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Çıkış</button>
                </div>
            </div>

            {status && <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>{status}</div>}

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* SOL: HARİTA VE FİLTRE */}
                <div style={{ flex: 2, minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Filtre Çubuğu */}
                    <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#34495e' }}>🔍 Filtrele:</span>
                        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minWidth: '150px' }}>
                            <option value="all">Tüm Araçlar</option>
                            {vehicleNames.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <input placeholder="Müşteri Adı Ara..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }} />
                        <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{filteredRoutes.length} Rota</span>
                    </div>

                    {/* Harita */}
                    <div style={{ border: '1px solid #e0e0e0', height: '650px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <MapDisplay externalRoutes={filteredRoutes} />
                    </div>
                </div>

                {/* SAĞ: DETAYLAR */}
                <div style={{ flex: 1, minWidth: '450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* İstasyon Yönetimi */}
                    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#34495e', borderBottom: '2px solid #f1f1f1', paddingBottom: '5px' }}>📍 İstasyon Yönetimi</h4>
                        <form onSubmit={handleAddStation} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input placeholder="Adı" value={newStationName} onChange={e => setNewStationName(e.target.value)} required style={{ flex: 2, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                <input placeholder="Lat" value={newLat} onChange={e => setNewLat(e.target.value)} required style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                <input placeholder="Lng" value={newLng} onChange={e => setNewLng(e.target.value)} required style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                <button type="submit" style={{ padding: '8px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                            </div>
                        </form>
                        <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #f1f1f1', borderRadius: '4px', padding: '5px' }}>
                            {stations.map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', borderBottom: '1px solid #f9f9f9', fontSize: '12px' }}>
                                    <span>{s.name}</span>
                                    <button onClick={() => handleDeleteStation(s.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Sil</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detaylı Rota Listesi */}
                    <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'white', flex: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, color: '#34495e', borderBottom: '2px solid #f1f1f1', paddingBottom: '10px' }}>
                            {showHistory ? '📜 Geçmiş Sefer Detayları' : '📋 Aktif Sefer Detayları'}
                        </h3>
                        {filteredRoutes.length === 0 ? <p style={{ color: '#999', textAlign: 'center' }}>Kriterlere uygun rota yok.</p> : (
                            <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                                {filteredRoutes.map(r => (
                                    <div key={r.id} style={{ marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong style={{ fontSize: '15px', color: '#2c3e50' }}>{r.vehicle.name}</strong>
                                                {r.vehicle.isRented && <span style={{ marginLeft: '10px', fontSize: '11px', backgroundColor: '#ffeeba', padding: '2px 5px', borderRadius: '4px', color: '#856404' }}>Kiralık</span>}
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '12px' }}><div>Mesafe: <b>{r.totalDistanceKm.toFixed(1)} km</b></div><div style={{ color: '#27ae60' }}>Maliyet: <b>{r.totalCost.toFixed(2)} TL</b></div></div>
                                        </div>
                                        <div style={{ padding: '10px', backgroundColor: '#fff' }}>
                                            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                                                <thead><tr style={{ color: '#7f8c8d', borderBottom: '1px solid #eee', textAlign: 'left' }}><th style={{ paddingBottom: '5px' }}>Sıra</th><th style={{ paddingBottom: '5px' }}>Durak</th><th style={{ paddingBottom: '5px' }}>Yük</th><th style={{ paddingBottom: '5px' }}>Müşteri</th></tr></thead>
                                                <tbody>{r.stops.map((stop, index) => (<tr key={index} style={{ borderBottom: '1px solid #f9f9f9' }}><td style={{ padding: '5px', fontWeight: 'bold' }}>{stop.visitOrder}.</td><td style={{ padding: '5px' }}>{stop.stationName}</td><td style={{ padding: '5px' }}>{stop.loadedCargoWeight} kg</td><td style={{ padding: '5px', color: '#2980b9' }}>{stop.customers && stop.customers.length > 0 ? stop.customers.join(", ") : "-"}</td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: ÖZET TABLO --- */}
            {showSummary && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0, color: '#8e44ad' }}>📊 Performans Özeti</h2>
                            <button onClick={() => setShowSummary(false)} style={closeButtonStyle}>X</button>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                            <div style={kpiCardStyle}><div style={kpiTitleStyle}>Toplam Maliyet</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>{stats.totalCost.toFixed(2)} TL</div></div>
                            <div style={kpiCardStyle}><div style={kpiTitleStyle}>Toplam Mesafe</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2980b9' }}>{stats.totalDist.toFixed(1)} km</div></div>
                            <div style={kpiCardStyle}><div style={kpiTitleStyle}>Taşınan Yük</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>{stats.totalCargo} kg</div></div>
                        </div>
                        <h4 style={{ marginBottom: '15px', color: '#34495e' }}>🚛 Araç Kapasite Kullanımı</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                            {allRoutes.map(r => {
                                const load = r.stops.reduce((sum, s) => sum + s.loadedCargoWeight, 0);
                                const percent = Math.min(100, (load / r.vehicle.capacityKg) * 100);
                                return (
                                    <div key={r.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                                            <strong>{r.vehicle.name} {r.vehicle.isRented && <span style={{ color: '#f39c12' }}>(Kiralık)</span>}</strong>
                                            <span>{load} / {r.vehicle.capacityKg} kg (%{percent.toFixed(0)})</span>
                                        </div>
                                        <div style={{ width: '100%', backgroundColor: '#eee', height: '10px', borderRadius: '5px' }}>
                                            <div style={{ width: `${percent}%`, backgroundColor: percent > 90 ? '#e74c3c' : percent > 50 ? '#27ae60' : '#f1c40f', height: '100%', borderRadius: '5px', transition: 'width 0.5s' }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: MESAFE MATRİSİ --- */}
            {showMatrix && matrixData && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: '90%', height: '90%', maxWidth: '1000px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>📏 Mesafe Matrisi (km)</h3>
                            <button onClick={() => setShowMatrix(false)} style={closeButtonStyle}>X</button>
                        </div>
                        <div style={{ overflow: 'auto', height: 'calc(100% - 50px)' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr><th style={{ padding: '8px', background: '#eee', border: '1px solid #ccc' }}>#</th>{matrixData.headers.map((h: any, i: any) => (<th key={i} style={{ padding: '8px', background: '#eee', border: '1px solid #ccc', minWidth: '60px' }}>{h}</th>))}</tr>
                                </thead>
                                <tbody>
                                    {matrixData.rows.map((row: any, i: any) => (<tr key={i}><td style={{ padding: '8px', background: '#eee', border: '1px solid #ccc', fontWeight: 'bold', position: 'sticky', left: 0 }}>{row.name}</td>{row.distances.map((d: any, j: any) => (<td key={j} style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'center', backgroundColor: d === 0 ? '#f0f0f0' : 'white', color: d === 0 ? '#ccc' : 'black' }}>{d}</td>))}</tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative' };
const closeButtonStyle: React.CSSProperties = { background: '#e74c3c', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' };
const kpiCardStyle: React.CSSProperties = { flex: 1, padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', textAlign: 'center', border: '1px solid #eee' };
const kpiTitleStyle: React.CSSProperties = { fontSize: '12px', color: '#7f8c8d', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' };

export default AdminPanel;