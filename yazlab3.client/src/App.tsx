import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Sayfaları import et 
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import UserPanel from './pages/UserPanel';
import AddNewUser from './pages/AddNewUser';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Login />} />

                    {/* Admin Panel Rotası ve Alt Rotası */}
                    <Route path="/admin-panel" element={<AdminPanel />} />

                    {/* Kullanıcı Ekleme Sayfası Alt Rotası */}
                    <Route path="/admin-panel/add-user" element={<AddNewUser />} />

                    <Route path="/user-panel" element={<UserPanel />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;