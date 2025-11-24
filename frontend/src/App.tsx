import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import React from "react";
import { Layout } from "antd";
import TableSpecialists from "./tableOfSpecialists";
import AppHeader from "./AppHeader.tsx";
// import AppHeader from "./AppHeader"; // ЗАКОММЕНТИРОВАНО
const { Header, Footer, Content } = Layout;

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  backgroundColor: "#0958d9",
  display: "block",
  overflow: "auto",
  width: "100%",
  margin: 0,
  padding: "1.5rem 1rem",
};

const footerStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  backgroundColor: "#4096ff",
  width: "100%",
  margin: 0,
  padding: 0,
};

const layoutStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  margin: 0,
  padding: 0,
};

function App() {
  const [count, setCount] = useState(0)

  return (
    // ЗАКОММЕНТИРОВАННАЯ ЧАСТЬ (старый код)
    // <>
    //   <div>
    //     <a href="https://vite.dev" target="_blank">
    //       <img src={viteLogo} className="logo" alt="Vite logo" />
    //     </a>
    //     <a href="https://react.dev" target="_blank">
    //       <img src={reactLogo} className="logo react" alt="React logo" />
    //     </a>
    //   </div>
    //   <h1>Vite + React</h1>
    //   <div className="card">
    //     <button onClick={() => setCount((count) => count + 1)}>
    //       count is {count}
    //     </button>
    //     <p>
    //       Edit <code>src/App.tsx</code> and save to test HMR
    //     </p>
    //   </div>
    //   <p className="read-the-docs">
    //     Click on the Vite and React logos to learn more
    //   </p>
    // </>

    // РАСКОММЕНТИРОВАННАЯ ЧАСТЬ (новый рабочий код)
    <Layout style={layoutStyle}>
      {/* ВРЕМЕННО ЗАКОММЕНТИРОВАНО ВСЕ КРОМЕ TableSpecialists */}
       <AppHeader></AppHeader>
      
      <Content style={contentStyle}>
        <TableSpecialists />
      </Content>
      
      {/* <Footer style={footerStyle}>Footer</Footer> */}
    </Layout>
  );
}

export default App;