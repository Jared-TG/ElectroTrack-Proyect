import { useState, useRef } from 'react';
import { BleManager, Device, State } from 'react-native-ble-plx';
import * as Location from 'expo-location';
import { Platform, PermissionsAndroid } from 'react-native';

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const DEVICE_NAME = 'ESP32_EnergyMonitor';

// Singleton — se reutiliza entre renders
let manager: BleManager | null = null;
function getManager() {
    if (!manager) {
        manager = new BleManager();
    }
    return manager;
}

export function useBLESetup() {
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Esperando...');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const deviceFoundRef = useRef(false);

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
        deviceFoundRef.current = false;

        const hasPermissions = await requestPermissions();
        if (!hasPermissions) return;

        const bleManager = getManager();

        // Asegurar que el BLE del celular está encendido
        const btState = await bleManager.state();
        if (btState !== State.PoweredOn) {
            setError('El Bluetooth de tu celular está apagado. Enciéndelo e intenta de nuevo.');
            return;
        }

        // IMPORTANTE: Detener cualquier escaneo previo antes de iniciar uno nuevo
        try {
            bleManager.stopDeviceScan();
        } catch (_) { /* ignorar si no había escaneo */ }

        setStatus('Buscando dispositivo cerca...');
        setIsScanning(true);

        console.log('[BLE] Iniciando escaneo con filtro de servicio UUID...');

        // Escanear filtrando por el UUID del servicio BLE del ESP32
        // Esto mejora enormemente la detección en Android
        bleManager.startDeviceScan(
            [SERVICE_UUID],  // Filtrar por UUID del servicio
            { allowDuplicates: false },
            (scanError, device) => {
                if (scanError) {
                    console.error('[BLE] Error de escaneo:', scanError);
                    setError(scanError.message);
                    setIsScanning(false);
                    bleManager.stopDeviceScan();
                    return;
                }

                // Verificar nombre Y localName (Android a veces usa uno u otro)
                const deviceName = device?.name || device?.localName || '';
                console.log(`[BLE] Dispositivo visto: ${deviceName || '(sin nombre)'} | ID: ${device?.id}`);

                if (device && (deviceName === DEVICE_NAME)) {
                    console.log('[BLE] ¡Dispositivo encontrado!:', deviceName);
                    deviceFoundRef.current = true;
                    bleManager.stopDeviceScan();
                    setIsScanning(false);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    connectToDevice(device);
                }
            }
        );

        // Timeout de 30 segundos
        timeoutRef.current = setTimeout(() => {
            if (!deviceFoundRef.current) {
                bleManager.stopDeviceScan();
                setIsScanning(false);
                setError('No se encontró el dispositivo. Verifica que esté encendido y cerca de tu celular.');
                setStatus('Tiempo de espera agotado.');
            }
        }, 30000);
    };

    const connectToDevice = async (device: Device) => {
        try {
            setStatus('Conectando al dispositivo...');
            const connected = await device.connect({ timeout: 10000 });
            
            setStatus('Descubriendo servicios...');
            await connected.discoverAllServicesAndCharacteristics();
            
            setConnectedDevice(connected);
            setStatus('¡Conectado! Listo para configurar Wi-Fi.');
        } catch (e: any) {
            console.error('[BLE] Error al conectar:', e);
            setError('Error al conectar: ' + e.message);
            setStatus('Error de conexión. Intenta de nuevo.');
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
            console.error('[BLE] Error al enviar:', e);
            setError('Error al enviar configuración: ' + e.message);
            return false;
        }
    };

    const disconnect = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        try {
            const bleManager = getManager();
            bleManager.stopDeviceScan();
        } catch (_) { /* ignorar */ }
        if (connectedDevice) {
            try {
                await connectedDevice.cancelConnection();
            } catch (_) { /* ignorar si ya estaba desconectado */ }
            setConnectedDevice(null);
        }
        setStatus('Desconectado.');
        setIsScanning(false);
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
