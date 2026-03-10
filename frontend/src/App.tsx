import TableSpecialistsPage from '../pages/tableSpecialistsPage';
import AuthorizationPage from '../pages/AuthorizationPage';
import NewAdvertisementsPage from '../pages/NewAdvertisementsPage'
import MainPage from '../pages/mainPage/MainPage';
import ProfilePage from '../pages/ProfilePage';
import { Routes, Route } from 'react-router-dom';
import SpecialisPage from "../pages/SpecialistPage.tsx";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={< MainPage/>}/>
        <Route path="/specialists" element={< TableSpecialistsPage/>} />
        <Route path="/specialists/:id" element={<SpecialisPage />} />
        <Route path="/auth" element={< AuthorizationPage/>} />
        <Route path="/create" element={<NewAdvertisementsPage/>} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
}

export default App;