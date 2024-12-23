import type { NextPage } from "next";
import { QueryClient, QueryClientProvider } from "react-query";
import { ResultsApp } from "../../components/Apps/ResultsApp";
import { APITokenProvider } from "../../contexts/APIToken";
import { AthleteDataProvider } from "../../contexts/AthleteData";
import { AuthStateProvider } from "../../contexts/AuthState";
import { ResultsDataProvider } from "../../contexts/ResultsData";
import { UnitsProvider } from "../../contexts/Units";

import { useRouter } from 'next/router';

const queryClient = new QueryClient();

const Results: NextPage = () => {
  const router = useRouter();
  const { resultsName } = router.query;

	console.log("Building Results for " + resultsName);
    return (
        <QueryClientProvider client={queryClient}>
            <APITokenProvider>
                <AuthStateProvider>
                    <UnitsProvider>
                        <ResultsDataProvider>
                            <ResultsApp />
                        </ResultsDataProvider>
                    </UnitsProvider>
                </AuthStateProvider>
            </APITokenProvider>
        </QueryClientProvider>
    );
};

export default Results;
