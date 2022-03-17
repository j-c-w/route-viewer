import {
    RideEfforts,
    RideSegment,
    SegmentAchievement,
    SegmentEffort,
} from "./stravaDataTypes";

export interface PREffort extends SegmentEffort {
    segmentId: string;
    athleteId: string;
}

export interface GCRider {
    name: string;
    athleteId: string;
    athlete_link: string;
    segments: number;
    timeInSeconds: number;
}

export interface GeneralClassification {
    men: GCRider[];
    women: GCRider[];
}

export interface RiderStats {
    id: string;
    name: string;
    athlete_link: string;
    prs: number;
    top10s: number;
    clubXoms: number;
    xoms: number;
    segments: number;
    completedRide: boolean;
    rideScore: number;
}

export interface TalliedRideEfforts {
    stats: {
        numberOfRiders: number;
        numberOfPRs: number;
        numberOfClubXoms: number;
        numberOfXOMs: number;
        longestSegment: [string, number];
        steepestSegment: [string, number];
        segmentWithMostPRs: [string, number];
    };
    riders: Record<string, RiderStats>;
    riderOfTheDay: RiderStats;
    xoms: {
        men: SegmentEffort[];
        women: SegmentEffort[];
    };
    clubXoms: {
        men: SegmentEffort[];
        women: SegmentEffort[];
    };
    prs: {
        men: PREffort[];
        women: PREffort[];
    };
    generalClassification: GeneralClassification;
}

function determineNumberOfRiders(results: RideEfforts) {
    const tmp: Record<string, boolean> = {};

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];
        for (const effort of segment.efforts.men) {
            tmp[effort.athlete_link] = true;
        }
        for (const effort of segment.efforts.women) {
            tmp[effort.athlete_link] = true;
        }
    }

    return Object.keys(tmp).length;
}

function determineNumberOfPRs(results: RideEfforts) {
    let prs = 0;

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];
        for (const effort of segment.efforts.men) {
            if (effort.achievement > 0) prs++;
        }
        for (const effort of segment.efforts.women) {
            if (effort.achievement > 0) prs++;
        }
    }

    return prs;
}

function determineNumberOfClubXOMs(results: RideEfforts) {
    let XOMs = 0;

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];
        const clubXomsMen = segment.clubXoms.men.map(
            (effort) => effort.segment_effort_id
        );
        const clubXomsWomen = segment.clubXoms.women.map(
            (effort) => effort.segment_effort_id
        );

        for (const effort of segment.efforts.men) {
            if (clubXomsMen.includes(effort.segment_effort_id)) XOMs++;
        }
        for (const effort of segment.efforts.women) {
            if (clubXomsWomen.includes(effort.segment_effort_id)) XOMs++;
        }
    }

    return XOMs;
}

function determineNumberOfXOMs(results: RideEfforts) {
    let XOMs = 0;

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];
        for (const effort of segment.efforts.men) {
            if (effort.achievement === 3) XOMs++;
        }
        for (const effort of segment.efforts.women) {
            if (effort.achievement === 3) XOMs++;
        }
    }

    return XOMs;
}

function determineLongestSegment(results: RideEfforts): [string, number] {
    let greatestDistance = 0;
    let longestSegment = "";

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];

        if (segment.segment.distance > greatestDistance) {
            greatestDistance = segment.segment.distance;
            longestSegment = segment.segment.name;
        }
    }

    return [longestSegment, greatestDistance];
}

function determineSteepestSegment(results: RideEfforts): [string, number] {
    let steepestGrade = 0;
    let steepestSegment = "";

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];

        if (segment.segment.average_grade > steepestGrade) {
            steepestGrade = segment.segment.average_grade;
            steepestSegment = segment.segment.name;
        }
    }

    return [steepestSegment, steepestGrade];
}

function determineSegmentWithMostPRs(results: RideEfforts): [string, number] {
    let mostPRs = 0;
    let segmentWithMostPRs = "";

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];
        let prs = 0;

        for (const effort of segment.efforts.men) {
            if (effort.achievement > 0) prs++;
        }
        for (const effort of segment.efforts.women) {
            if (effort.achievement > 0) prs++;
        }

        if (prs > mostPRs) {
            mostPRs = prs;
            segmentWithMostPRs = segment.segment.name;
        }
    }

    return [segmentWithMostPRs, mostPRs];
}

function tallyResultsByRider(results: RideEfforts) {
    const resultsByRider: Record<string, RiderStats> = {};
    const numberOfSegments = results.segmentsInOrder.length;

    const tallyByRider = (effort: SegmentEffort) => {
        let riderStats = resultsByRider[effort.athlete_link];

        if (!riderStats) {
            resultsByRider[effort.athlete_link] = riderStats = {
                id: effort.athlete_link.split("/").slice(-1)[0],
                name: effort.athlete_name,
                athlete_link: effort.athlete_link,
                prs: 0,
                top10s: 0,
                clubXoms: 0,
                xoms: 0,
                segments: 0,
                completedRide: false,
            } as RiderStats;
        }

        riderStats.segments++;

        switch (effort.achievement) {
            case 1:
                riderStats.prs++;
                break;
            case 2:
                riderStats.top10s++;
                break;
            case 3:
                riderStats.xoms++;
                break;
        }

        riderStats.completedRide = riderStats.segments === numberOfSegments;

        const numAchievements =
            riderStats.prs + riderStats.top10s + riderStats.xoms;

        riderStats.rideScore =
            riderStats.prs +
            3 * riderStats.top10s +
            6 * riderStats.xoms +
            (numAchievements === numberOfSegments ? 20 : 0);
    };

    for (const segmentId of results.segmentsInOrder) {
        const segment: RideSegment = results.segments[segmentId];
        segment.efforts.men.forEach(tallyByRider);
        segment.efforts.women.forEach(tallyByRider);
    }

    return resultsByRider;
}

function determineRiderOfTheDay(resultsByRider: Record<string, RiderStats>) {
    const arr = Object.values(resultsByRider);

    return arr
        .filter((rider) => rider.completedRide)
        .sort((a, b) => b.rideScore - a.rideScore)[0];
}

function listClubXOMs(results: RideEfforts) {
    const men: SegmentEffort[] = [];
    const women: SegmentEffort[] = [];

    for (const segmentId of results.segmentsInOrder) {
        const segment: RideSegment = results.segments[segmentId];
        const clubXomsMen = segment.clubXoms.men.map(
            (effort) => effort.segment_effort_id
        );
        const clubXomsWomen = segment.clubXoms.women.map(
            (effort) => effort.segment_effort_id
        );

        for (const effort of segment.efforts.men) {
            if (clubXomsMen.includes(effort.segment_effort_id)) {
                effort.achievement = SegmentAchievement.CLUB_XOM;
                men.push(effort);
            }
        }
        for (const effort of segment.efforts.women) {
            if (clubXomsWomen.includes(effort.segment_effort_id)) {
                effort.achievement = SegmentAchievement.CLUB_XOM;
                women.push(effort);
            }
        }
    }

    return {
        men,
        women,
    };
}

function listXOMs(results: RideEfforts) {
    const men: SegmentEffort[] = [];
    const women: SegmentEffort[] = [];

    for (const segmentId of results.segmentsInOrder) {
        const segment: RideSegment = results.segments[segmentId];
        for (const effort of segment.efforts.men) {
            if (effort.achievement === 3) men.push(effort);
        }
        for (const effort of segment.efforts.women) {
            if (effort.achievement === 3) women.push(effort);
        }
    }

    return {
        men,
        women,
    };
}

function listPRs(results: RideEfforts) {
    const men: PREffort[] = [];
    const women: PREffort[] = [];

    for (const segmentId of results.segmentsInOrder) {
        const segment: RideSegment = results.segments[segmentId];
        for (const effort of segment.efforts.men) {
            const athleteId = effort.athlete_link.split("/").slice(-1)[0];
            if (effort.achievement > 0)
                men.push({ segmentId, athleteId, ...effort } as PREffort);
        }
        for (const effort of segment.efforts.women) {
            const athleteId = effort.athlete_link.split("/").slice(-1)[0];
            if (effort.achievement > 0)
                women.push({ segmentId, athleteId, ...effort } as PREffort);
        }
    }

    return {
        men,
        women,
    };
}

function determineGC(results: RideEfforts) {
    const numSegments = results.segmentsInOrder.length;
    const men: Record<string, GCRider> = {};
    const women: Record<string, GCRider> = {};

    for (const segmentId in results.segments) {
        const segment: RideSegment = results.segments[segmentId];
        for (const effort of segment.efforts.men) {
            const maleEffort = men[effort.athlete_link];
            if (!maleEffort) {
                men[effort.athlete_link] = {
                    name: effort.athlete_name,
                    athleteId: effort.athlete_link.split("/").slice(-1)[0],
                    athlete_link: effort.athlete_link,
                    segments: 1,
                    timeInSeconds: effort.elapsed_time,
                } as GCRider;
            } else {
                maleEffort.segments += 1;
                maleEffort.timeInSeconds += effort.elapsed_time;
            }
        }
        for (const effort of segment.efforts.women) {
            const femaleEffort = women[effort.athlete_link];
            if (!femaleEffort) {
                women[effort.athlete_link] = {
                    name: effort.athlete_name,
                    athleteId: effort.athlete_link.split("/").slice(-1)[0],
                    athlete_link: effort.athlete_link,
                    segments: 1,
                    timeInSeconds: effort.elapsed_time,
                } as GCRider;
            } else {
                femaleEffort.segments += 1;
                femaleEffort.timeInSeconds += effort.elapsed_time;
            }
        }
    }

    // filter by athletes that did not do all the segments
    const maleEfforts = Object.values(men)
        .filter((effort) => effort.segments === numSegments)
        .sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    const femaleEfforts = Object.values(women)
        .filter((effort) => effort.segments === numSegments)
        .sort((a, b) => a.timeInSeconds - b.timeInSeconds);

    return {
        men: maleEfforts,
        women: femaleEfforts,
    } as GeneralClassification;
}

export function resultsConverter(results: RideEfforts): TalliedRideEfforts {
    const talliedResultsByRider = tallyResultsByRider(results);

    return {
        stats: {
            numberOfRiders: determineNumberOfRiders(results),
            numberOfPRs: determineNumberOfPRs(results),
            numberOfClubXoms: determineNumberOfClubXOMs(results),
            numberOfXOMs: determineNumberOfXOMs(results),
            longestSegment: determineLongestSegment(results),
            steepestSegment: determineSteepestSegment(results),
            segmentWithMostPRs: determineSegmentWithMostPRs(results),
        },
        riders: talliedResultsByRider,
        riderOfTheDay: determineRiderOfTheDay(talliedResultsByRider),
        clubXoms: listClubXOMs(results),
        xoms: listXOMs(results),
        prs: listPRs(results),
        generalClassification: determineGC(results),
    };
}

export function riderResultsToHighlightString(riderResults: RiderStats) {
    const result = [];
    const { prs, top10s, clubXoms, xoms, segments } = riderResults;

    result.push(
        segments === 1 ? `${segments} Segment` : `${segments} Segments`
    );

    if (prs > 0 || top10s > 0 || clubXoms > 0 || xoms > 0) {
        const count = prs + top10s + clubXoms + xoms;
        result.push(`${count} PR${count !== 1 ? "s" : ""}`);
    }
    if (top10s > 0) {
        result.push(`${top10s} Top10${top10s !== 1 ? "s" : ""}`);
    }
    if (clubXoms > 0) {
        result.push(`${clubXoms} ClubXOM${clubXoms !== 1 ? "s" : ""}`);
    }
    if (xoms > 0) {
        result.push(`${xoms} XOM${xoms !== 1 ? "s" : ""}`);
    }

    return result.join(", ");
}
