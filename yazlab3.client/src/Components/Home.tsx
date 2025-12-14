import MapDisplay from './MapDisplay';

// 'export const' yerine 'export function' veya direkt default kullanabiliriz
// Senin App.tsx dosyan "import { Home } from ..." yaptığı için böyle bırakıyoruz:
export const Home = () => {
    return (
        <div>
            <h1>Kargo İşletme Sistemi</h1>
            <p>Kocaeli İli Dağıtım Haritası</p>

            <MapDisplay />
        </div>
    );
};