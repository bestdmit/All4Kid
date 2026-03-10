import { Layout } from "antd";
import TableSpecialists from "../src/tableOfSpecialists";
import AppHeader from "../src/Header/AppHeader";
const { Content } = Layout;


function TableSpecialistsPage() {

  return (
    <Layout >
      <AppHeader />
      
      <Content>
        <TableSpecialists />
      </Content>
    </Layout>
  );
}

export default TableSpecialistsPage;