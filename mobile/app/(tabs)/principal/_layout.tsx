import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

function TabBarIcon(props: {
  IconComponent: any;
  name: string;
  color: string;
  size?: number;
}) {
  const { IconComponent, name, color, size = 24 } = props;
  return <IconComponent name={name} size={size} color={color} style={{ marginBottom: -3 }} />;
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#333333',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          backgroundColor: '#000000',
        },
      }}>

      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <TabBarIcon IconComponent={FontAwesome5} name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <TabBarIcon IconComponent={Ionicons} name="time-outline" color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="dispositivos"
        options={{
          title: 'Dispositivos',
          tabBarIcon: ({ color }) => (
            <TabBarIcon IconComponent={Ionicons} name="phone-portrait-outline" color={color} size={26} />
          ),
        }}
      />

      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color }) => (
            <TabBarIcon IconComponent={Ionicons} name="settings-outline" color={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
