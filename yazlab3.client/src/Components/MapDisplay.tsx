import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// İkonları import ediyoruz
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet ikon fix (TypeScript uyumlu hale getirildi)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

// Veritabanından gelecek verinin "Tipi"ni tanımlıyoruz
interface Station {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    // Büyük harf gelme ihtimaline karşı opsiyonel tanımlar
    Name?: string;
    Latitude?: number;
    Longitude?: number;
}

const MapDisplay = () => {
    // State'in bir Station listesi olduğunu belirtiyoruz <Station[]>
    const [stations, setStations] = useState < Station[] > ([]);
    const [loading, setLoading] = useState(true);

    const centerPosition: [number, number] = [40.7654, 29.9408];

    useEffect(() => {
        async function fetchStations() {
            try {
                // Senin port numaran: 5054
                const apiUrl = 'http://localhost:5054/api/stations';

                console.log("İstek atılıyor:", apiUrl);

                const response = await fetch(apiUrl);

                if (response.ok) {
                    const data = await response.json();
                    console.log("Gelen Veri:", data);
                    setStations(data);
                } else {
                    console.error("Backend hatası:", response.status);
                }
            } catch (error) {
                console.error("Fetch hatası:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStations();
    }, []);

    return (
        <div style={{ height: "600px", width: "100%", marginTop: "20px" }}>
            {loading && <p>Veriler yükleniyor...</p>}

            <MapContainer center={centerPosition} zoom={10} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* TEST MARKER */}
                <Marker position={[40.7654, 29.9408]}>
                    <Popup>MERKEZ (İZMİT)</Popup>
                </Marker>

                {/* Veritabanından Gelen İstasyonlar */}
                {stations.map(station => {
                    // Hem büyük hem küçük harf kontrolü
                    const lat = station.latitude || station.Latitude;
                    const lng = station.longitude || station.Longitude;
                    const name = station.name || station.Name;

                    if (!lat || !lng) return null;

                    return (
                        <Marker
                            key={station.id}
                            position={[lat, lng]}
                        >
                            <Popup>
                                <b>{name}</b>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapDisplay;