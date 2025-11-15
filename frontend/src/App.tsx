import React from "react";
import { Layout } from "antd";
import TableSpecialists from "./tableOfSpecialists";
const { Header, Footer, Content } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  height: 64,
  lineHeight: "64px",
  backgroundColor: "#4096ff",
  width: "100%",
  margin: 0,
  padding: 0,
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  minHeight: "calc(100vh - 128px)",
  color: "#fff",
  backgroundColor: "#0958d9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  width: "100%",
  margin: 0,
  padding: 0,
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
  height: "100vh",
  width: "100vw",
  margin: 0,
  padding: 0,
};

function App() {
  return (
    <Layout style={layoutStyle}>
      <Header style={headerStyle}>Header</Header>
      <Content style={contentStyle}>
        <TableSpecialists />
      </Content>
      <Footer style={footerStyle}>Footer</Footer>
    </Layout>
  );
}

export default App;
