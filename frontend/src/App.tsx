import { useState } from 'react'
import React from "react";
import TableSpecialistsPage from '../pages/tableSpecialistsPage';
import AuthorizationPage from './AuthorizationPage';
import NewAdvertisementsPage from '../pages/NewAdvertisementsPage'
import { Routes, Route } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={< TableSpecialistsPage/>} />
        <Route path="/authorization" element={< AuthorizationPage/>} />
        <Route path="/create" element={<NewAdvertisementsPage/>} />
      </Routes>
    </div>
  );
}

export default App;