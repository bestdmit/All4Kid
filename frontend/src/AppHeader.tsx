import { Layout, Button } from "antd";
const { Header } = Layout;

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

function AppHeader() {
  return (
    <Header style={headerStyle}>
      <Button ghost variant="outlined">
        Главная
      </Button>
      <Button ghost variant="outlined">
        Каталог
      </Button>
    </Header>
  );
}

export default AppHeader;