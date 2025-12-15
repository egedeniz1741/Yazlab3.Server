import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Sayfaları import et (Dosya uzantısı yazmana gerek yok)
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import UserPanel from './pages/UserPanel';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/admin-panel" element={<AdminPanel />} />
                    <Route path="/user-panel" element={<UserPanel />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;