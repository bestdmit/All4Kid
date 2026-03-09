import React from "react";
import { Flex, Spin, Empty } from "antd";
import SpecialistCard from "./SpecialistCard";
import { useSpecialists } from "../hooks/useSpecialists";
import type { Specialist } from "./api/specialists";

export default function BestSpecialistsCards(){
  const { specialists, loading } = useSpecialists();

  const topSpecialists = [...specialists]
    .sort((a, b) => b.rating - a.rating || b.experience - a.experience)
    .slice(0, 4);

  if (loading && specialists.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (!loading && topSpecialists.length === 0) {
    return <Empty description="Специалисты временно недоступны" />;
  }

  return (
    <Flex wrap gap={'middle'} justify={"center"}>
      {topSpecialists.map((spec: Specialist) => (
        <SpecialistCard specialist={spec} key={spec.id} />
      ))}
    </Flex>
  );
}