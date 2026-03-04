import { useState } from 'react'
import React from "react";
import { Layout } from "antd";
import TableSpecialists from "../src/tableOfSpecialists";
import AppHeader from "../src/Header/AppHeader";
const { Header, Footer, Content } = Layout;


function TableSpecialistsPage() {

  return (
    <Layout >
      <AppHeader></AppHeader>
      
      <Content>
        <TableSpecialists />
      </Content>
    </Layout>
  );
}

export default TableSpecialistsPage;