import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';


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

                    
                    <Route path="/admin-panel" element={<AdminPanel />} />

                
                    <Route path="/admin-panel/add-user" element={<AddNewUser />} />

                    <Route path="/user-panel" element={<UserPanel />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;