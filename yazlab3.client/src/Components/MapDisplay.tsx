import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

interface Station { id: number; name: string; latitude: number; longitude: number; }
interface RouteStop { id: number; visitOrder: number; station: Station; loadedCargoWeight: number; }
interface Vehicle { name: string; capacityKg: number; isRented: boolean; rentalCost: number; }
interface DeliveryRoute { id: number; vehicle: Vehicle; totalDistanceKm: number; totalCost: number; stops: RouteStop[]; }
interface VisualRoute extends DeliveryRoute { coordinates: [number, number][]; color: string; }

// --- PROPS TANIMI EKLENDİ ---
// Artık bu bileşen dışarıdan 'externalRoutes' alabilir
interface MapDisplayProps {
    externalRoutes?: DeliveryRoute[] | null;
}

const MapDisplay = ({ externalRoutes }: MapDisplayProps) => {
    const [stations, setStations] = useState<Station[]>([]);
    const [visualRoutes, setVisualRoutes] = useState<VisualRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Yükleniyor...");

    const colors = ['#FF0000', '#0000FF', '#008000', '#800080', '#FF8C00', '#00CED1'];

    // --- YOL GEOMETRİSİ ÇEKME ---
    const fetchRouteGeometry = async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<number[][]> => {
        const sLat = parseFloat(startLat.toString());
        const sLng = parseFloat(startLng.toString());
        const eLat = parseFloat(endLat.toString());
        const eLng = parseFloat(endLng.toString());

        if (Math.abs(sLat - eLat) < 0.0001 && Math.abs(sLng - eLng) < 0.0001) return [[sLat, sLng]];

        try {
            // PROXY KULLANIMI (/osrm)
            const url = `/osrm/route/v1/driving/${sLng},${sLat};${eLng},${eLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);

            if (!response.ok) return [[sLat, sLng], [eLat, eLng]];

            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            }
            return [[sLat, sLng], [eLat, eLng]];
        } catch (err) {
            return [[sLat, sLng], [eLat, eLng]];
        }
    };

    // --- HARİTA VERİSİNİ HAZIRLA ---
    const processRoutes = async (rawRoutes: DeliveryRoute[]) => {
        setStatusMessage("Harita çiziliyor...");
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
                    const targetLat = parseFloat(stop.station.latitude.toString());
                    const targetLng = parseFloat(stop.station.longitude.toString());
                    const segment = await fetchRouteGeometry(currLat, currLng, targetLat, targetLng);
                    if (segment.length > 0) segment.forEach((pt: number[]) => fullPath.push([pt[0], pt[1]]));
                    currLat = targetLat;
                    currLng = targetLng;
                }
            }
            const returnSegment = await fetchRouteGeometry(currLat, currLng, 40.7654, 29.9408);
            returnSegment.forEach((pt: number[]) => fullPath.push([pt[0], pt[1]]));

            processedRoutes.push({
                ...route,
                coordinates: fullPath as [number, number][],
                // Rengin sabit kalması için ID'ye göre renk seçimi
                color: colors[route.id % colors.length]
            });
        }
        setVisualRoutes(processedRoutes);
        setLoading(false);
    };

    useEffect(() => {
        const initData = async () => {
            try {
                // İstasyonları her zaman çek
                const sRes = await fetch('/api/stations');
                if (sRes.ok) setStations(await sRes.json());

                // Eğer dışarıdan (AdminPanel'den) filtrelenmiş rota geldiyse ONU KULLAN
                if (externalRoutes) {
                    if (externalRoutes.length === 0) {
                        setStatusMessage("Filtreye uygun rota yok.");
                        setVisualRoutes([]);
                        setLoading(false);
                    } else {
                        await processRoutes(externalRoutes);
                    }
                }
                // Eğer dışarıdan veri gelmediyse (UserPanel), KENDİN ÇEK
                else {
                    const rRes = await fetch('/api/Optimization/routes');
                    if (rRes.ok) {
                        const data = await rRes.json();
                        if (data.length > 0) await processRoutes(data);
                        else { setStatusMessage("Rota yok."); setLoading(false); }
                    }
                }
            } catch (err) {
                console.error(err);
                setStatusMessage("Veri hatası.");
                setLoading(false);
            }
        };

        // Eğer externalRoutes değişirse (filtre yapılırsa) tekrar çiz
        initData();
    }, [externalRoutes]);

    return (
        <div style={{ height: "100%", width: "100%", position: 'relative' }}>
            {loading && <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1000, background: 'white', padding: '8px', borderRadius: '4px', fontWeight: 'bold', border: '1px solid black' }}>{statusMessage}</div>}

            <MapContainer center={[40.7654, 29.9408]} zoom={9} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {stations.map(s => (
                    <Marker key={`s-${s.id}`} position={[parseFloat(s.latitude.toString()), parseFloat(s.longitude.toString())]}>
                        <Popup><b>{s.name}</b></Popup>
                    </Marker>
                ))}
                <Marker position={[40.7654, 29.9408]} icon={new L.Icon({ iconUrl: markerIcon, iconSize: [25, 41], className: 'huechange' })}><Popup><b>MERKEZ DEPO</b></Popup></Marker>

                {visualRoutes.map((r) => (
                    <Polyline key={`line-${r.id}`} positions={r.coordinates} pathOptions={{ color: r.color, weight: 6, opacity: 0.9 }}>
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <b style={{ color: r.color }}>{r.vehicle.name}</b><br />{r.totalDistanceKm.toFixed(1)} km
                            </div>
                        </Popup>
                    </Polyline>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapDisplay;