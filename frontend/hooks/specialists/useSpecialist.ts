import {useEffect, useState} from "react";
import {type Specialist, specialistApi} from "../../src/api/specialists";

export const useSpecialist = (id: number) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [specialist, setSpecialist] = useState<Specialist | null>(null);

    const { fetchByID } = specialistApi;

    useEffect(() => {
        if (!id) {
            setSpecialist(null);
            setLoading(false);
            setError(null);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await fetchByID(id);

                setSpecialist(result);
                setLoading(false);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Произошла ошибка при загрузке";

                setError(errorMessage);
                setLoading(false);
            }
        };

        loadData();
    }, [id,]);

    const clearError = () => {
        setError(null)
    }

    return {
        specialist,
        loading,
        error,
        clearError
    };
}