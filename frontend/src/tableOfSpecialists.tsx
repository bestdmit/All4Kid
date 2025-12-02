import React from "react";
import { Card, Flex, Button } from "antd";
import { useSpecialists } from "../hooks/useSpecialists";
import SpecialistCard from "./SpecialistCard";
import type { Specialist } from "../stores/specialistStore";
const cardStyle: React.CSSProperties = {
  width: "300px"
};

function TableSpecialists() {
  const { specialists, loading, error, refetch } = useSpecialists();

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center' }}>Загрузка специалистов...</div>;
  }

  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center' }}>
        Ошибка: {error}
        <br />
        <Button type="primary" onClick={refetch} style={{ marginTop: 10 }}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <Flex align={"center"} justify={"center"} vertical>
      <Flex wrap gap={'middle'} justify={"center"}>
        {specialists.map((item:Specialist) =>
          <SpecialistCard specialist={item}/>
        )}
      </Flex>
    </Flex>
  );
}

export default TableSpecialists;