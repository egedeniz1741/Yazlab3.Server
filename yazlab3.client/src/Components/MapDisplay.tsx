import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// İkon Ayarları (Resimlerin kaybolmaması için)
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
interface VisualRoute extends DeliveryRoute { coordinates: [number, number][]; color: string; }

// Dışarıdan veri alabilmesi için Props (Filtreleme desteği)
interface MapDisplayProps {
    externalRoutes?: DeliveryRoute[] | null;
}

const MapDisplay = ({ externalRoutes }: MapDisplayProps) => {
    const [stations, setStations] = useState<Station[]>([]);
    const [visualRoutes, setVisualRoutes] = useState<VisualRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Yükleniyor...");

    // Canlı Renk Paleti
    const colors = ['#FF0000', '#0000FF', '#008000', '#800080', '#FF8C00', '#00CED1'];

    // --- YOL GEOMETRİSİ ÇEKME (PROXY + DOCKER) ---
    const fetchRouteGeometry = async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<number[][]> => {
        const sLat = parseFloat(startLat.toString());
        const sLng = parseFloat(startLng.toString());
        const eLat = parseFloat(endLat.toString());
        const eLng = parseFloat(endLng.toString());

        // Noktalar aynıysa çizim yapma
        if (Math.abs(sLat - eLat) < 0.0001 && Math.abs(sLng - eLng) < 0.0001)
            return [[sLat, sLng]];

        try {
            // Proxy (/osrm) üzerinden Docker'a istek at
            const url = `/osrm/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;

            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`OSRM Hatası (${response.status}): Düz çizgiye dönülüyor.`);
                return [[sLat, sLng], [eLat, eLng]];
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                // Koordinatları çevir [Lng, Lat] -> [Lat, Lng]
                return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            }

            return [[sLat, sLng], [eLat, eLng]];
        } catch (err) {
            console.error("Bağlantı Hatası:", err);
            return [[sLat, sLng], [eLat, eLng]];
        }
    };

    // --- ROTALARI İŞLEME VE ÇİZME ---
    const processRoutes = async (rawRoutes: DeliveryRoute[]) => {
        setStatusMessage("Harita çiziliyor...");
        const processedRoutes: VisualRoute[] = [];

        for (let i = 0; i < rawRoutes.length; i++) {
            const route = rawRoutes[i];
            const fullPath: [number, number][] = [];

            // 1. Durakları Sırala
            const sortedStops = route.stops.sort((a, b) => a.visitOrder - b.visitOrder);

            if (sortedStops.length === 0) continue;

            // 2. BAŞLANGIÇ NOKTASI: İLK DURAK (Eskiden Depoydu, Şimdi İlk İstasyon)
            let currLat = parseFloat(sortedStops[0].station.latitude.toString());
            let currLng = parseFloat(sortedStops[0].station.longitude.toString());

            // İlk durağı yola ekle
            fullPath.push([currLat, currLng]);

            // 3. DİĞER DURAKLARI GEZ
            // Döngü 1'den başlar çünkü 0. durak zaten başlangıç noktamız
            for (let j = 1; j < sortedStops.length; j++) {
                const stop = sortedStops[j];
                if (stop.station) {
                    const targetLat = parseFloat(stop.station.latitude.toString());
                    const targetLng = parseFloat(stop.station.longitude.toString());

                    const segment = await fetchRouteGeometry(currLat, currLng, targetLat, targetLng);

                    if (segment.length > 0) {
                        segment.forEach((pt: number[]) => fullPath.push([pt[0], pt[1]]));
                    }

                    currLat = targetLat;
                    currLng = targetLng;
                }
            }

            // 4. SON HEDEF: UMUTTEPE KAMPÜSÜ (Toplama Merkezi)
            const umuttepeLat = 40.8221;
            const umuttepeLng = 29.9215;

            const finalSegment = await fetchRouteGeometry(currLat, currLng, umuttepeLat, umuttepeLng);
            finalSegment.forEach((pt: number[]) => fullPath.push([pt[0], pt[1]]));

            console.log(`Rota ${route.id} Çizildi. Nokta Sayısı: ${fullPath.length}`);

            processedRoutes.push({
                ...route,
                coordinates: fullPath as [number, number][],
                // Rengi ID'ye göre sabitle (Filtrelemede renk değişmesin diye)
                color: colors[route.id % colors.length]
            });
        }
        setVisualRoutes(processedRoutes);
        setLoading(false);
    };

    useEffect(() => {
        const initData = async () => {
            try {
                // İstasyonları çek
                const sRes = await fetch('/api/stations');
                if (sRes.ok) setStations(await sRes.json());

                // Rotaları Belirle (Filtreli mi, Tümü mü?)
                if (externalRoutes) {
                    // Admin panelinden filtreli veri geldiyse
                    if (externalRoutes.length === 0) {
                        setStatusMessage("Filtreye uygun rota yok.");
                        setVisualRoutes([]);
                        setLoading(false);
                    } else {
                        await processRoutes(externalRoutes);
                    }
                } else {
                    // Kullanıcı paneli veya ilk açılış (Tümünü çek)
                    const rRes = await fetch('/api/Optimization/routes');
                    if (rRes.ok) {
                        const data = await rRes.json();
                        if (data.length > 0) await processRoutes(data);
                        else { setStatusMessage("Gösterilecek rota yok."); setLoading(false); }
                    }
                }
            } catch (err) {
                console.error("Veri Hatası:", err);
                setStatusMessage("Veri yüklenemedi.");
                setLoading(false);
            }
        };

        initData();
    }, [externalRoutes]); // externalRoutes değişince yeniden çalış

    return (
        <div style={{ height: "100%", width: "100%", position: 'relative' }}>
            {loading && <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1000, background: 'white', padding: '8px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid black' }}>{statusMessage}</div>}

            <MapContainer center={[40.7654, 29.9408]} zoom={9} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* İSTASYONLAR */}
                {stations.map(s => (
                    <Marker key={`s-${s.id}`} position={[parseFloat(s.latitude.toString()), parseFloat(s.longitude.toString())]}>
                        <Popup><b>{s.name}</b></Popup>
                    </Marker>
                ))}

                {/* UMUTTEPE KAMPÜSÜ MARKER (Eski Merkez Depo Yerine) */}
                <Marker position={[40.821768, 29.923476]} icon={new L.Icon({ iconUrl: markerIcon, iconSize: [25, 41], className: 'huechange' })}>
                    <Popup>
                        <div style={{ textAlign: 'center' }}>
                            <b>KOÜ UMUTTEPE</b><br />
                            🏁 Toplama Merkezi
                        </div>
                    </Popup>
                </Marker>

                {/* ROTALAR */}
                {visualRoutes.map((r) => (
                    <Polyline
                        key={`line-${r.id}`}
                        positions={r.coordinates}
                        pathOptions={{ color: r.color, weight: 6, opacity: 0.8 }}
                    >
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <b style={{ color: r.color }}>{r.vehicle.name}</b><hr style={{ margin: '5px 0' }} />
                                Mesafe: <b>{r.totalDistanceKm.toFixed(1)} km</b><br />
                                Maliyet: <b>{r.totalCost.toFixed(2)} TL</b>
                            </div>
                        </Popup>
                    </Polyline>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapDisplay;