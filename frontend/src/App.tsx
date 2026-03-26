import TableSpecialistsPage from '../pages/tableSpecialistsPage';
import AuthorizationPage from '../pages/AuthorizationPage';
import NewAdvertisementsPage from '../pages/NewAdvertisementsPage'
import MainPage from '../pages/mainPage/MainPage';
import ProfilePage from '../pages/ProfilePage';
import {Routes, Route, Navigate} from 'react-router-dom';
import SpecialisPage from "../pages/SpecialistPage.tsx";
import AdminPage from "../pages/AdminPage.tsx";
import {useAuth} from "../hooks/useAuth.ts";

function App() {
  const {user} = useAuth()

  return (
    <div className="App">
      <Routes>
        <Route path='/' element={< MainPage/>}/>
        <Route path="/specialists" element={< TableSpecialistsPage/>} />
        <Route path="/specialists/:id" element={<SpecialisPage />} />
        <Route path="/auth" element={< AuthorizationPage/>} />
        <Route path="/create" element={<NewAdvertisementsPage/>} />
        <Route path="/profile" element={<ProfilePage />} />
        {user?.role == 'admin' ? <Route path="/admin" element={<AdminPage />}/> : <Route path="/admin" element={<Navigate to="/" replace />} />}
      </Routes>
    </div>
  );
}

export default App;