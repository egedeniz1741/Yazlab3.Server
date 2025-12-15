import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173, // Frontend portu
        proxy: {
            // 1. Backend API İstekleri (Zaten çalışıyordu ama garanti olsun)
            '/api': {
                target: 'http://localhost:5054', // Backend adresi
                changeOrigin: true,
                secure: false
            },
            // 2. HARİTA İÇİN EKLENEN KISIM (CORS Çözümü)
            '/osrm': {
                target: 'http://localhost:5000', // Docker adresi
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/osrm/, '') // "/osrm" silinir, gerisi gider
            }
        }
    }
});