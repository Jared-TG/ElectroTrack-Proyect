import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CircularMeter from '@/components/CircularMeter';

interface Device {
  id: string;
  name: string;
  icon: string;
  watts: number;
  isOn: boolean;
}

export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'Ventilador', icon: 'fan', watts: 60, isOn: true },
    { id: '2', name: 'Dispensador de Agua', icon: 'water', watts: 550, isOn: true },
    { id: '3', name: 'Televisión', icon: 'tv', watts: 120, isOn: true },
  ]);

  // Calcular consumo total de dispositivos encendidos
  const totalWatts = devices.reduce((sum, device) => {
    return device.isOn ? sum + device.watts : sum;
  }, 0);

  // Calcular costo estimado (ejemplo: $0.35 MXN por kWh)
  const kwhCost = 0.35;
  const hoursPerMonth = 720; // 30 días x 24 horas
  const monthlyKwh = (totalWatts / 1000) * hoursPerMonth;
  const estimatedCost = `$${Math.round(monthlyKwh * kwhCost)} MXN`;

  const toggleDevice = (deviceId: string) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.id === deviceId ? { ...device, isOn: !device.isOn } : device
      )
    );
  };

  const getDeviceIcon = (iconName: string) => {
    switch (iconName) {
      case 'fan':
        return <MaterialCommunityIcons name="fan" size={28} color="#FFD700" />;
      case 'water':
        return <Ionicons name="water" size={28} color="#FFD700" />;
      case 'tv':
        return <Ionicons name="tv" size={28} color="#FFD700" />;
      default:
        return <Ionicons name="hardware-chip" size={28} color="#FFD700" />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenido a Electrotrack</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Medidor Circular */}
        <CircularMeter
          currentWatts={totalWatts}
          maxWatts={2000}
          estimatedCost={estimatedCost}
        />

        {/* Control de Dispositivos */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>Control de Dispositivos</Text>

          {devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceLeft}>
                <View style={styles.iconContainer}>
                  {getDeviceIcon(device.icon)}
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceWatts}>{device.watts}w</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>

              <Switch
                value={device.isOn}
                onValueChange={() => toggleDevice(device.id)}
                trackColor={{ false: '#333', true: '#FFD700' }}
                thumbColor={device.isOn ? '#FFF' : '#666'}
                ios_backgroundColor="#333"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
  },
  devicesSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 15,
  },
  deviceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceWatts: {
    fontSize: 13,
    color: '#888',
  },
});
