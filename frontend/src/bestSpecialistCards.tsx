import React from "react";
import { Flex  } from "antd";
import SpecialistCard from "./SpecialistCard";
import { useSpecialistStore } from "../stores/specialistStore";
import type { Specialist } from "../stores/specialistStore";
export default function BestSpecialistsCards(){
    const {getTopRatedSpecialists} = useSpecialistStore();

    const topSpecialists = getTopRatedSpecialists(4);
    return(
        <Flex wrap gap={'middle'} justify={"center"}>
        {topSpecialists.map((spec: Specialist) =>
          <SpecialistCard specialist={spec}/>
        )}
      </Flex>
    )
}