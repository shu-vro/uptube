import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

export interface HeatMarker {
  type: string;
  marker_duration_millis: number;
  time_range_start_millis: number;
  heat_marker_intensity_score_normalized: number;
}

export interface HeatmapData {
  type: string;
  heat_markers: HeatMarker[];
  max_height_dp: number;
  min_height_dp: number;
  heat_markers_decorations?: any[];
  show_hide_animation_duration_millis?: number;
}

type Props = {
  heatmap: HeatmapData;
  width: number;
  height?: number;
};

/**
 * Checks if the given value is a valid heatmap object with heat_markers.
 */
export function isValidHeatmap(heatmap: any): heatmap is HeatmapData {
  return (
    heatmap &&
    typeof heatmap === 'object' &&
    heatmap.type === 'Heatmap' &&
    Array.isArray(heatmap.heat_markers) &&
    heatmap.heat_markers.length > 0
  );
}

/**
 * Renders a heatmap area chart (like YouTube's "Most Replayed" graph)
 * above the video seek bar.
 */
export default function HeatmapGraph({ heatmap, width, height = 32 }: Props) {
  const path = useMemo(() => {
    const markers = heatmap.heat_markers;
    if (!markers || markers.length === 0) return '';

    const totalDuration =
      markers[markers.length - 1].time_range_start_millis +
      markers[markers.length - 1].marker_duration_millis;

    if (totalDuration <= 0) return '';

    // Build points array
    const points: { x: number; y: number }[] = markers.map((m) => {
      const centerTime = m.time_range_start_millis + m.marker_duration_millis / 2;
      const x = (centerTime / totalDuration) * width;
      const intensity = m.heat_marker_intensity_score_normalized;
      // Map intensity to y (0 = bottom, height = top)
      const y = height - intensity * height;
      return { x, y };
    });

    // Create a smooth curve using cardinal spline or simple bezier
    // Using monotone cubic interpolation for a smooth area chart
    if (points.length < 2) return '';

    let d = `M 0 ${height}`; // start at bottom-left
    d += ` L ${points[0].x} ${points[0].y}`;

    // Smooth cubic bezier through points
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    // Close the path at bottom-right
    d += ` L ${width} ${height}`;
    d += ' Z';

    return d;
  }, [heatmap, width, height]);

  if (!path) return null;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="heatmapGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="white" stopOpacity="0.6" />
            <Stop offset="1" stopColor="white" stopOpacity="0.15" />
          </SvgLinearGradient>
        </Defs>
        <Path d={path} fill="url(#heatmapGradient)" />
        {/* Stroke line on top of the area */}
        <Path
          d={path.replace(/ L \d+\.?\d* \d+\.?\d* Z$/, '')}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}
