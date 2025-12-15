import React, { useEffect, useState } from 'react';
import MapDisplay from '../Components/MapDisplay';

// Backend'den gelecek istasyon tipi
interface Station {
    id: number;
    name: string;
}

const UserPanel = () => {
    // State Tanımları
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStationId, setSelectedStationId] = useState<number | string>("");
    const [cargoCount, setCargoCount] = useState(0);
    const [weight, setWeight] = useState(0);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // Sayfa açılınca İstasyonları Çek
    useEffect(() => {
        fetch('http://localhost:5054/api/stations')
            .then(res => res.json())
            .then(data => setStations(data))
            .catch(err => console.error("İstasyonlar çekilemedi", err));
    }, []);

    // Kargo Ekleme Fonksiyonu
    const handleAddCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        // 1. Giriş yapan kullanıcının ID'sini tarayıcı hafızasından al
        const storedUserId = localStorage.getItem("userId");

        // Eğer kullanıcı giriş yapmamışsa veya ID yoksa durdur
        if (!storedUserId) {
            setMessage("❌ Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
            return;
        }

        // 2. Form doğrulama
        if (!selectedStationId || cargoCount <= 0 || weight <= 0) {
            setMessage("⚠️ Lütfen istasyon seçin ve pozitif değerler girin.");
            return;
        }

        // 3. Gönderilecek Veriyi Hazırla (Backend bu formatı bekliyor)
        const newRequest = {
            userId: Number(storedUserId),      // String gelen ID'yi sayıya çevir
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
                setMessage("✅ Kargo talebi başarıyla oluşturuldu!");
                setIsSuccess(true);
                // Formu sıfırla
                setCargoCount(0);
                setWeight(0);
                setSelectedStationId("");
            } else {
                // Backend'den dönen hata detayını okumaya çalışalım
                const errorData = await response.json().catch(() => null);
                console.error("Hata Detayı:", errorData);
                setMessage(`❌ Hata: ${errorData?.title || "İstek reddedildi (400)."}`);
            }
        } catch (error) {
            console.error("Fetch Hatası:", error);
            setMessage("❌ Sunucuya erişilemedi.");
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>
            {/* SOL TARAF: FORM PANELİ */}
            <div style={{ width: '350px', padding: '30px', borderRight: '1px solid #ddd', backgroundColor: '#fff' }}>
                <h2 style={{ marginBottom: '10px' }}>📦 Kargo Gönder</h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    Aşağıdaki formu doldurarak kargo talebi oluşturabilirsiniz.
                </p>

                <form onSubmit={handleAddCargo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* İstasyon Seçimi */}
                    <div>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Hedef İstasyon:</label>
                        <select
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                            value={selectedStationId}
                            onChange={(e) => setSelectedStationId(e.target.value)}
                        >
                            <option value="">Seçiniz...</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kargo Adedi */}
                    <div>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Kargo Adedi:</label>
                        <input
                            type="number"
                            min="1"
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                            value={cargoCount || ''}
                            onChange={(e) => setCargoCount(Number(e.target.value))}
                        />
                    </div>

                    {/* Ağırlık */}
                    <div>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Toplam Ağırlık (kg):</label>
                        <input
                            type="number"
                            min="1"
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                            value={weight || ''}
                            onChange={(e) => setWeight(Number(e.target.value))}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            marginTop: '10px'
                        }}
                    >
                        Talebi Ekle
                    </button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '20px',
                        padding: '10px',
                        borderRadius: '5px',
                        backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
                        color: isSuccess ? '#155724' : '#721c24',
                        fontWeight: '500'
                    }}>
                        {message}
                    </div>
                )}
            </div>

            {/* SAĞ TARAF: HARİTA */}
            <div style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ marginBottom: '15px' }}>Canlı İstasyon Haritası</h3>
                <div style={{ height: 'calc(100% - 50px)', border: '2px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapDisplay />
                </div>
            </div>
        </div>
    );
};

export default UserPanel;