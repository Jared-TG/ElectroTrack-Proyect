import { useState, useRef } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import * as Location from 'expo-location';
import { Platform, PermissionsAndroid } from 'react-native';

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const DEVICE_NAME = 'ESP32_EnergyMonitor';

const manager = new BleManager();

export function useBLESetup() {
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Esperando...');

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            if (locationStatus !== 'granted') {
                setError('Permiso de ubicación denegado. Es necesario para Bluetooth.');
                return false;
            }

            // Para Android 12+ (API 31+)
            if (Platform.Version >= 31) {
                const bluetoothScanPermission = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
                );
                const bluetoothConnectPermission = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
                );
                if (
                    bluetoothScanPermission !== PermissionsAndroid.RESULTS.GRANTED ||
                    bluetoothConnectPermission !== PermissionsAndroid.RESULTS.GRANTED
                ) {
                    setError('Permisos de Bluetooth denegados.');
                    return false;
                }
            }
        }
        return true;
    };

    const scanAndConnect = async () => {
        setError(null);
        setConnectedDevice(null);
        
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) return;

        setStatus('Buscando dispositivo cerca...');
        setIsScanning(true);

        manager.startDeviceScan(null, null, (scanError, device) => {
            if (scanError) {
                console.error(scanError);
                setError(scanError.message);
                setIsScanning(false);
                manager.stopDeviceScan();
                return;
            }

            if (device && device.name === DEVICE_NAME) {
                console.log('Dispositivo encontrado:', device.name);
                manager.stopDeviceScan();
                setIsScanning(false);
                connectToDevice(device);
            }
        });

        // Timeout de 15 segundos
        setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
            if (!connectedDevice) {
                setStatus('Tiempo de espera agotado. Asegúrate de que el dispositivo esté encendido.');
            }
        }, 15000);
    };

    const connectToDevice = async (device: Device) => {
        try {
            setStatus('Conectando al dispositivo...');
            const connected = await device.connect();
            
            setStatus('Descubriendo servicios...');
            await connected.discoverAllServicesAndCharacteristics();
            
            setConnectedDevice(connected);
            setStatus('¡Conectado! Listo para configurar Wi-Fi.');
        } catch (e: any) {
            console.error(e);
            setError('Error al conectar: ' + e.message);
            setStatus('Error de conexión.');
        }
    };

    const sendWiFiCredentials = async (ssid: string, pass: string) => {
        if (!connectedDevice) {
            setError('No hay un dispositivo conectado.');
            return false;
        }

        setStatus('Enviando credenciales...');
        const payload = JSON.stringify({ ssid, pass });
        
        // Convertir string a base64 (requerido por react-native-ble-plx)
        const base64Payload = btoa(payload);

        try {
            await connectedDevice.writeCharacteristicWithResponseForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                base64Payload
            );
            setStatus('¡Configuración enviada correctamente!');
            return true;
        } catch (e: any) {
            console.error(e);
            setError('Error al enviar configuración: ' + e.message);
            return false;
        }
    };

    const disconnect = async () => {
        if (connectedDevice) {
            await connectedDevice.cancelConnection();
            setConnectedDevice(null);
            setStatus('Desconectado.');
        }
    };

    return {
        isScanning,
        connectedDevice,
        error,
        status,
        scanAndConnect,
        sendWiFiCredentials,
        disconnect
    };
}
