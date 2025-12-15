import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- İKON TANIMLARI ---
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

// --- TİP TANIMLAMALARI ---
interface Station { id: number; name: string; latitude: number; longitude: number; }
interface RouteStop { id: number; visitOrder: number; station: Station; loadedCargoWeight: number; }
interface Vehicle { name: string; capacityKg: number; isRented: boolean; rentalCost: number; }
interface DeliveryRoute { id: number; vehicle: Vehicle; totalDistanceKm: number; totalCost: number; stops: RouteStop[]; }

// Görselleştirme için genişletilmiş rota
interface VisualRoute extends DeliveryRoute {
    coordinates: [number, number][];
    color: string;
}

const MapDisplay = () => {
    const [stations, setStations] = useState<Station[]>([]);
    const [visualRoutes, setVisualRoutes] = useState<VisualRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Veriler yükleniyor...");

    const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'];

    // --- YOL GEOMETRİSİNİ ÇEKEN FONKSİYON (TIMEOUT KORUMALI) ---
    const fetchRouteGeometry = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
        // Eğer noktalar aynıysa veya çok yakınsa işlem yapma
        if (startLat === endLat && startLng === endLng) return [[startLat, startLng]];

        const controller = new AbortController();
        // 1 saniye içinde cevap gelmezse iptal et (Düz çizgiye düş)
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Zamanlayıcıyı temizle

            if (!response.ok) throw new Error("API Hatası");

            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                // Koordinatları çevir
                return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            }
            throw new Error("Rota yok");
        } catch (error) {
            // HATA VEYA ZAMAN AŞIMI OLURSA DÜZ ÇİZGİ DÖN
            return [[startLat, startLng], [endLat, endLng]];
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. İstasyonları Çek
                const sRes = await fetch('http://localhost:5054/api/stations');
                if (sRes.ok) setStations(await sRes.json());

                // 2. Rotaları Çek
                const rRes = await fetch('http://localhost:5054/api/Optimization/routes');
                if (rRes.ok) {
                    const rawRoutes: DeliveryRoute[] = await rRes.json();

                    if (rawRoutes.length === 0) {
                        setStatusMessage("Gösterilecek rota yok.");
                        setLoading(false);
                        return;
                    }

                    setStatusMessage(`Harita çiziliyor... (${rawRoutes.length} araç)`);

                    const processedRoutes: VisualRoute[] = [];

                    for (let i = 0; i < rawRoutes.length; i++) {
                        const route = rawRoutes[i];
                        const fullPath: [number, number][] = [];

                        let currLat = 40.7654;
                        let currLng = 29.9408;
                        fullPath.push([currLat, currLng]);

                        const sortedStops = route.stops.sort((a, b) => a.visitOrder - b.visitOrder);

                        for (const stop of sortedStops) {
                            if (stop.station) {
                                // Parça parça yolu al
                                const segment = await fetchRouteGeometry(currLat, currLng, stop.station.latitude, stop.station.longitude);
                                fullPath.push(...(segment as [number, number][]));

                                currLat = stop.station.latitude;
                                currLng = stop.station.longitude;
                            }
                        }

                        // Dönüş Yolu
                        const returnSegment = await fetchRouteGeometry(currLat, currLng, 40.7654, 29.9408);
                        fullPath.push(...(returnSegment as [number, number][]));

                        processedRoutes.push({
                            ...route,
                            coordinates: fullPath,
                            color: colors[i % colors.length]
                        });
                    }
                    setVisualRoutes(processedRoutes);
                }
            } catch (err) {
                console.error("Veri Hatası:", err);
                setStatusMessage("Veri yüklenemedi.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <div style={{ height: "100%", width: "100%", position: 'relative' }}>
            {loading && (
                <div style={{
                    position: 'absolute', top: 10, left: 50, zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.9)', padding: '10px 20px',
                    borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    fontWeight: 'bold', color: '#333'
                }}>
                    {statusMessage}
                </div>
            )}

            <MapContainer center={[40.7654, 29.9408]} zoom={9} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* İSTASYONLAR */}
                {stations.map(s => (
                    <Marker key={`st-${s.id}`} position={[s.latitude, s.longitude]}>
                        <Popup><b>{s.name}</b></Popup>
                    </Marker>
                ))}

                {/* DEPO */}
                <Marker position={[40.7654, 29.9408]} icon={new L.Icon({ iconUrl: markerIcon, iconSize: [25, 41], className: 'huechange' })}>
                    <Popup><b>MERKEZ DEPO</b></Popup>
                </Marker>

                {/* ROTALAR */}
                {visualRoutes.map((route) => (
                    <Polyline
                        key={`line-${route.id}`}
                        positions={route.coordinates}
                        pathOptions={{ color: route.color, weight: 5, opacity: 0.8 }}
                    >
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <b style={{ color: route.color }}>{route.vehicle.name}</b><hr style={{ margin: '5px 0' }} />
                                Mesafe: <b>{route.totalDistanceKm.toFixed(1)} km</b><br />
                                Maliyet: <b>{route.totalCost.toFixed(1)} TL</b>
                            </div>
                        </Popup>
                    </Polyline>
                ))}

            </MapContainer>
        </div>
    );
};

export default MapDisplay;