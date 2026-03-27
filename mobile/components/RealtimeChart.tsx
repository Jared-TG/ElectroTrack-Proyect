import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';

interface DataPoint {
    x: number;
    y: number;
}

interface RealtimeChartProps {
    data: DataPoint[];
    width?: number;
    height?: number;
    lineColor?: string;
    label?: string;
}

/**
 * Gráfico de línea en tiempo real usando react-native-svg.
 * Dibuja una curva suave con los datos proporcionados.
 */
export default function RealtimeChart({
    data,
    width = 320,
    height = 200,
    lineColor = '#FFD700',
    label,
}: RealtimeChartProps) {
    const padding = { top: 20, right: 16, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (data.length === 0) {
        return (
            <View style={[styles.container, { width, height }]}>
                <Text style={styles.noData}>Esperando datos...</Text>
            </View>
        );
    }

    // Calcular rangos
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = 0;
    const yMax = Math.max(Math.ceil(Math.max(...yValues) / 10) * 10, 10);

    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    // Convertir datos a coordenadas SVG
    const toSvgX = (x: number) => padding.left + ((x - xMin) / xRange) * chartWidth;
    const toSvgY = (y: number) => padding.top + chartHeight - ((y - yMin) / yRange) * chartHeight;

    // Crear path suave (curva cúbica de Bézier)
    const buildSmoothPath = (points: DataPoint[]): string => {
        if (points.length < 2) {
            const p = points[0];
            return `M ${toSvgX(p.x)} ${toSvgY(p.y)}`;
        }

        let path = `M ${toSvgX(points[0].x)} ${toSvgY(points[0].y)}`;

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const prevPrev = points[i - 2] || prev;
            const next = points[i + 1] || curr;

            // Puntos de control para curva suave
            const cp1x = toSvgX(prev.x) + (toSvgX(curr.x) - toSvgX(prevPrev.x)) / 4;
            const cp1y = toSvgY(prev.y) + (toSvgY(curr.y) - toSvgY(prevPrev.y)) / 4;
            const cp2x = toSvgX(curr.x) - (toSvgX(next.x) - toSvgX(prev.x)) / 4;
            const cp2y = toSvgY(curr.y) - (toSvgY(next.y) - toSvgY(prev.y)) / 4;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toSvgX(curr.x)} ${toSvgY(curr.y)}`;
        }

        return path;
    };

    const linePath = buildSmoothPath(data);

    // Generar labels del eje Y (5 divisiones)
    const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (yRange * i) / 4);

    // Generar labels del eje X (máx 5 ticks)
    const xTickCount = Math.min(5, data.length);
    const xTicks = Array.from({ length: xTickCount }, (_, i) => {
        const idx = Math.floor((i * (data.length - 1)) / Math.max(xTickCount - 1, 1));
        return data[idx]?.x ?? 0;
    });

    return (
        <View style={[styles.container, { width, height }]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <Svg width={width} height={height}>
                {/* Grid lines horizontales */}
                {yTicks.map((tick, i) => (
                    <Line
                        key={`grid-${i}`}
                        x1={padding.left}
                        y1={toSvgY(tick)}
                        x2={width - padding.right}
                        y2={toSvgY(tick)}
                        stroke="#333"
                        strokeWidth={0.5}
                    />
                ))}

                {/* Eje Y labels */}
                {yTicks.map((tick, i) => (
                    <SvgText
                        key={`y-label-${i}`}
                        x={padding.left - 8}
                        y={toSvgY(tick) + 4}
                        fill="#888"
                        fontSize={11}
                        textAnchor="end"
                    >
                        {Math.round(tick)}
                    </SvgText>
                ))}

                {/* Eje X labels */}
                {xTicks.map((tick, i) => (
                    <SvgText
                        key={`x-label-${i}`}
                        x={toSvgX(tick)}
                        y={height - 6}
                        fill="#888"
                        fontSize={11}
                        textAnchor="middle"
                    >
                        {Math.round(tick)}
                    </SvgText>
                ))}

                {/* Línea del gráfico */}
                <Path
                    d={linePath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    noData: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 60,
    },
    label: {
        color: '#CCC',
        fontSize: 13,
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
});
