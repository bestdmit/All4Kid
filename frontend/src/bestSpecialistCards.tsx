import { Spin, Empty, Flex } from "antd";
import SpecialistCard from "./SpecialistCard";
import { useSpecialists } from "../hooks/specialists/useSpecialists.ts";
import type { Specialist } from "./api/specialists";
import { useNavigate } from "react-router-dom";
import "./bestSpecialistsCards.css";

export default function BestSpecialistsCards(){
  const { specialists, loading } = useSpecialists();
  const navigate = useNavigate();

  const handleSpecialistClick = (id: number) => {
    navigate(`/specialists/${id}`);
  };

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
        <div key={spec.id} className="best-specialist-card">
          <SpecialistCard
            specialist={spec}
            onClick={handleSpecialistClick}
          />
        </div>
      ))}
    </Flex>
  );
}