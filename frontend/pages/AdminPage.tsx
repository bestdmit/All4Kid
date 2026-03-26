import { Layout } from "antd";
import AppHeader from "../src/Header/AppHeader.tsx";
import ReviewsModerationPanel from "../src/components/admin/ReviewsModerationPanel.tsx";

const AdminPage = () => {
    return (
        <Layout>
            <AppHeader/>
            <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
              <ReviewsModerationPanel />
            </div>
        </Layout>
    )
}

export default AdminPage;