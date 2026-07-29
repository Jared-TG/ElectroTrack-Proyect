import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api.config';

export function usePushNotifications() {
    const { user } = useAuth();
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        const requestUserPermission = async () => {
            if (Platform.OS === 'android') {
                if (Platform.Version >= 33) {
                    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
                }
            }
            
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Authorization status:', authStatus);
                getFcmToken();
            }
        };

        const getFcmToken = async () => {
            try {
                const token = await messaging().getToken();
                if (token) {
                    console.log('Your FCM Token is:', token);
                    setFcmToken(token);
                    
                    // Send token to backend if user is logged in
                    if (user?.id) {
                        await fetch(`${API_URL}/usuarios/${user.id}/fcm-token`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ fcm_token: token }),
                        });
                        console.log('FCM Token sent to backend');
                    }
                }
            } catch (error) {
                console.error('Failed to get FCM token', error);
            }
        };

        requestUserPermission();

        // Listen to whether the token changes
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
            setFcmToken(token);
            if (user?.id) {
                fetch(`${API_URL}/usuarios/${user.id}/fcm-token`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fcm_token: token }),
                });
            }
        });

        return () => {
            unsubscribeTokenRefresh();
        };
    }, [user?.id]);

    return { fcmToken };
}
