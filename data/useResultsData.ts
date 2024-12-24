import { useQuery } from "react-query";
import { RideEfforts } from "./stravaDataTypes";

const S3_BUCKET = process.env.S3_BUCKET_AWS;
const queryOptions = {
    cacheTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
};

export function useResultsData(resultsName: string) {
    const url = `https://raw.githubusercontent.com/j-c-w/hillz_data/refs/heads/main/${resultsName}.json`;
	console.log('data url is ' + url);

    return useQuery<RideEfforts, Error>(
        "results-from-public",
        () => fetch(url).then((res) => res.json()),
        queryOptions
    );
}
