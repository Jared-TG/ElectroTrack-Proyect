import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface CircularMeterProps {
  currentWatts: number;
  maxWatts: number;
  estimatedCost: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularMeter({ currentWatts, maxWatts, estimatedCost }: CircularMeterProps) {
  const percentage = Math.min((currentWatts / maxWatts) * 100, 100);
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  const size = 220;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: percentage,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.meterContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Círculo de fondo (gris) */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#333"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Círculo animado (amarillo) */}
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              stroke="#FFD700"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        
        {/* Texto central */}
        <View style={styles.centerContent}>
          <Text style={styles.wattsText}>{currentWatts}</Text>
          <Text style={styles.wattsLabel}>w</Text>
          <Text style={styles.usageLabel}>Uso actual</Text>
        </View>
      </View>

      {/* Costo estimado */}
      <View style={styles.costContainer}>
        <Text style={styles.costLabel}>Costo estimado del mes:</Text>
        <Text style={styles.costValue}>{estimatedCost}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  meterContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    transform: [{ rotateZ: '180deg' }],
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wattsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  wattsLabel: {
    fontSize: 20,
    color: '#FFF',
    marginTop: -8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 4,
  },
  costContainer: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    minWidth: 250,
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});
