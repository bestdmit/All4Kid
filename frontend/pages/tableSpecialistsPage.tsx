import { useState } from 'react'
import React from "react";
import { Layout } from "antd";
import TableSpecialists from "../src/tableOfSpecialists";
import AppHeader from "../src/Header/AppHeader";
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

function TableSpecialistsPage() {
  const [count, setCount] = useState(0)

  return (
    <Layout style={layoutStyle}>
      <AppHeader></AppHeader>
      
      <Content style={contentStyle}>
        <TableSpecialists />
      </Content>
    </Layout>
  );
}

export default TableSpecialistsPage;