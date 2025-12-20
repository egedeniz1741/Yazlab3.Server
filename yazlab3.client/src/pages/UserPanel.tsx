import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapDisplay from '../Components/MapDisplay';


interface Station { id: number; name: string; latitude: number; longitude: number; }
interface MyCargo { id: number; targetStation: string; cargoCount: number; weightKg: number; date: string; status: string; }


interface PreviewRoute {
    id: number;
    vehicle: { name: string; capacityKg: number; isRented: boolean; rentalCost: number; };
    totalDistanceKm: number;
    totalCost: number;
    stops: {
        id: number;
        visitOrder: number;
        station: Station;
        loadedCargoWeight: number;
    }[];
}

const UserPanel = () => {
    const navigate = useNavigate();


    const [stations, setStations] = useState<Station[]>([]);
    const [myCargos, setMyCargos] = useState<MyCargo[]>([]);

  
    const [selectedStations, setSelectedStations] = useState<Station[]>([]);

 
    const [cargoCount, setCargoCount] = useState(0);
    const [weight, setWeight] = useState(0);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);


    const [previewRoutes, setPreviewRoutes] = useState<PreviewRoute[]>([]);

    useEffect(() => {
     
        fetch('/api/stations').then(res => res.json()).then(data => setStations(data));
       
        fetchMyCargos();
    }, []);

    const fetchMyCargos = () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            fetch(`/api/CargoRequests/user/${userId}`)
                .then(res => res.json())
                .then(data => setMyCargos(data))
                .catch(err => console.error(err));
        } else {
            navigate('/');
        }
    };


    const handleAddStationToList = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stationId = Number(e.target.value);
        if (!stationId) return;

        const stationToAdd = stations.find(s => s.id === stationId);

        if (stationToAdd) {
           
            if (!selectedStations.some(s => s.id === stationId)) {
                setSelectedStations([...selectedStations, stationToAdd]);
            }
        }
        e.target.value = ""; 
    };

  
    const handleRemoveStation = (id: number) => {
        setSelectedStations(selectedStations.filter(s => s.id !== id));
    };

   
    const handleCancelCargo = async (id: number) => {
        if (!window.confirm("Bu kargo talebini iptal etmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/CargoRequests/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("✅ Talep başarıyla iptal edildi.");
                fetchMyCargos(); 
            } else {
                const data = await res.json();
                alert("❌ " + (data.message || "Hata oluştu."));
            }
        } catch (err) { alert("Sunucu hatası."); }
    };

   
    useEffect(() => {
        if (selectedStations.length === 0) {
            setPreviewRoutes([]);
            return;
        }

     
        const dummyRoute: PreviewRoute = {
            id: 999,
            vehicle: { name: "Planlanan Rota", capacityKg: 0, isRented: false, rentalCost: 0 },
            totalDistanceKm: 0,
            totalCost: 0,
            stops: selectedStations.map((station, index) => ({
                id: station.id,
                visitOrder: index + 1,
                station: station,
                loadedCargoWeight: 0
            }))
        };

        setPreviewRoutes([dummyRoute]);
    }, [selectedStations]);

   
    const handleSubmitAll = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        const storedUserId = localStorage.getItem("userId");
        if (!storedUserId) { setMessage("❌ Oturum yok."); return; }

        if (selectedStations.length === 0 || cargoCount <= 0 || weight <= 0) {
            setMessage("⚠️ Lütfen en az bir durak seçin ve yük bilgilerini girin.");
            return;
        }

        try {
            let successCount = 0;
           
            for (const station of selectedStations) {
                const newRequest = {
                    userId: Number(storedUserId),
                    targetStationId: station.id,
                    cargoCount: Number(cargoCount),
                    weightKg: Number(weight),
                    deliveryDate: new Date().toISOString(),
                    isProcessed: false
                };

                const response = await fetch('/api/cargorequests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRequest)
                });

                if (response.ok) successCount++;
            }

            if (successCount === selectedStations.length) {
                setMessage(`✅ ${successCount} adet kargo talebi oluşturuldu!`);
                setIsSuccess(true);
                setCargoCount(0); setWeight(0); setSelectedStations([]);
                fetchMyCargos();
            } else {
                setMessage("⚠️ İşlem sırasında bazı hatalar oluştu.");
            }

        } catch (error) { setMessage("❌ Sunucu hatası."); }
    };

    const handleLogout = () => {
        if (window.confirm("Çıkış yapmak istiyor musunuz?")) {
            localStorage.clear();
            navigate('/');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'row', backgroundColor: '#f4f6f9' }}>

        
            <div style={{ width: '400px', padding: '30px', backgroundColor: '#fff', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <h2 style={{ margin: '0', color: '#2c3e50' }}>Kargo Talep Paneli</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Toplama noktalarını seçerek rotanızı oluşturun.</p>
                </div>

              
                <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', backgroundColor: '#fafafa' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>📍 Yeni Talep Oluştur</h4>

                    <form onSubmit={handleSubmitAll} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                     
                        <div>
                            <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Durak Ekle:</label>
                            <select
                                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                onChange={handleAddStationToList}
                                defaultValue=""
                            >
                                <option value="" disabled>Seçiniz...</option>
                                {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                       
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', minHeight: '30px' }}>
                            {selectedStations.length === 0 && <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Henüz durak seçilmedi.</span>}
                            {selectedStations.map((s, index) => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e3f2fd', color: '#1565c0', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', border: '1px solid #bbdefb' }}>
                                    <b>{index + 1}.</b> {s.name}
                                    <span onClick={() => handleRemoveStation(s.id)} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ef5350', marginLeft: '5px' }}>✕</span>
                                </div>
                            ))}
                        </div>

                      
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '5px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Koli (Her Durak):</label>
                                    <input type="number" min="1" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} value={cargoCount || ''} onChange={(e) => setCargoCount(Number(e.target.value))} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Ağırlık (kg):</label>
                                    <input type="number" min="1" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} value={weight || ''} onChange={(e) => setWeight(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>

                        <button type="submit" style={{ padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>Talebi Gönder</button>
                    </form>
                    {message && <div style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', backgroundColor: isSuccess ? '#d4edda' : '#f8d7da', color: isSuccess ? '#155724' : '#721c24', fontSize: '13px', textAlign: 'center' }}>{message}</div>}
                </div>

               
                <div style={{ flex: 1, minHeight: '150px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#34495e' }}>📋 Bekleyen Taleplerim</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '10px' }}>
                        {myCargos.length === 0 ? <p style={{ padding: '20px', color: '#999', textAlign: 'center', fontSize: '13px' }}>Kayıt yok.</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', textAlign: 'left', color: '#7f8c8d', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '8px' }}>Nokta</th>
                                        <th style={{ padding: '8px' }}>Yük</th>
                                        <th style={{ padding: '8px' }}>Durum</th>
                                        <th style={{ padding: '8px' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myCargos.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.targetStation}</td>
                                            <td style={{ padding: '8px' }}>{c.weightKg} kg</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: c.status.includes("Yolda") ? '#d4edda' : '#fff3cd', color: c.status.includes("Yolda") ? '#155724' : '#856404' }}>{c.status}</span>
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {!c.status.includes("Yolda") && (
                                                    <button onClick={() => handleCancelCargo(c.id)} style={{ padding: '4px 8px', backgroundColor: '#ef5350', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>İptal</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Çıkış Yap</button>
            </div>

          
            <div style={{ flex: 1, padding: '20px' }}>
                <div style={{ height: '100%', border: '2px solid #ddd', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <MapDisplay externalRoutes={previewRoutes as any} />
                </div>
            </div>
        </div>
    );
};

export default UserPanel;