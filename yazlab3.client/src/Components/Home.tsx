import MapDisplay from './MapDisplay';


export const Home = () => {
    return (
        <div>
            <h1>Kargo İşletme Sistemi</h1>
            <p>Kocaeli İli Dağıtım Haritası</p>

            <MapDisplay />
        </div>
    );
};