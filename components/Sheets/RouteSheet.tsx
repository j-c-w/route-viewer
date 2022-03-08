import React, { useEffect, useRef, useState } from "react";

import { DetailedSegment, Route } from "../../data/stravaDataTypes";
import { Sheet, SheetViewState } from "../Sheets/Sheet";
import { SheetMetadata } from "../Misc/SheetMetadata";
import { SheetTitle } from "../Misc/SheetTitle";
import {
    distanceStr,
    elevationStr,
    unitsStr,
} from "../../utils/unitConversions";
import { useUnitsContext } from "../../contexts/Units";
import { SegmentListItem } from "../Misc/SegmentListItem";

import styles from "../Sheets/Sheet.module.css";
import typography from "../../styles/Typography.module.css";

export const RouteSheet: React.ComponentType<{
    route: Route | undefined;
    segments: DetailedSegment[];
    viewState: SheetViewState;
    setViewState: (value: SheetViewState) => void;
    onSegmentSelect: (value: DetailedSegment) => void;
}> = ({ route, segments, viewState, setViewState, onSegmentSelect }) => {
    const { units } = useUnitsContext();
    const titleRef = useRef<HTMLDivElement>(null);
    const [segmentListHeight, setSegmentListHeight] = useState(0);
    const [defaultHeight, setDefaultHeight] = useState(0);

    const link = `https://www.strava.com/routes/${route?.id_str}`;
    const distance = distanceStr(units, route?.distance, 2);
    const elevation = elevationStr(units, route?.elevation_gain, 0);
    const numSegments = (segments || []).length.toFixed(0);

    useEffect(() => {
        const titleEl = titleRef.current;
        const componentEl = titleEl?.parentElement;

        if (!titleEl || !componentEl) return;

        const componentRect = componentEl.getBoundingClientRect();
        const titleRect = titleEl.getBoundingClientRect();
        const listHeight = componentRect.height - titleRect.height;

        setSegmentListHeight(listHeight);
        setDefaultHeight(titleRect.height + 30);
    }, [viewState, titleRef, setSegmentListHeight, setDefaultHeight]);

    const segmentItems = segments.map((segment, i) => {
        const distance = distanceStr(units, segment.distance, 2);
        const elevation = elevationStr(units, segment.total_elevation_gain, 0);

        return (
            <SegmentListItem
                key={i}
                index={i + 1}
                title={segment.name}
                onClick={() => onSegmentSelect(segment)}
            >
                <span className={typography.semanticallyReduced}>
                    {distance}
                    {unitsStr(units, "km")}
                </span>
                <span className={typography.semanticallyReduced}>
                    {elevation}
                    {unitsStr(units, "m")}
                </span>
                <span className={typography.semanticallyReduced}>
                    {segment.average_grade}%
                </span>
            </SegmentListItem>
        );
    });

    if (!route) return <div></div>;

    return (
        <Sheet
            viewState={viewState}
            onChangeViewState={setViewState}
            defaultHeight={defaultHeight}
        >
            <div ref={titleRef}>
                <SheetTitle title={route.name} link={link} />
                <div className={styles.metadataContainer}>
                    <SheetMetadata
                        num={distance}
                        unit={unitsStr(units, "km")}
                        description={"Distance"}
                    />
                    <SheetMetadata
                        num={elevation}
                        unit={unitsStr(units, "m")}
                        description={"Elevation"}
                    />
                    <SheetMetadata
                        num={numSegments}
                        unit={""}
                        description={"Segments"}
                        onClick={() => setViewState(SheetViewState.FULL)}
                    />
                </div>
            </div>
            <div
                style={{
                    height: `${segmentListHeight}px`,
                    overflowY: "scroll",
                }}
            >
                {segmentItems}
            </div>
        </Sheet>
    );
};