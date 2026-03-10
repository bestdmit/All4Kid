import { Layout } from "antd";
import AppHeader from "../src/Header/AppHeader";
import NewAdvertisements from '../src/NewAdvertisements';
const { Content } = Layout;
const contentStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#fff",
  backgroundColor: "#D9E5FF",
  display: "block",
  overflow: "auto",
  width: "100%",
  margin: 0,
  padding: "1.5rem 1rem",
};

const layoutStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  margin: 0,
  padding: 0,
};
export default function NewAdvertisementsPage(){
    return(
    <Layout style={layoutStyle}>
      <AppHeader />
      
      <Content style={contentStyle}>
        <NewAdvertisements />
      </Content>
    </Layout>
    )
}