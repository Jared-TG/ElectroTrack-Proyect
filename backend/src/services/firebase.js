const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

let app;
try {
    const serviceAccount = require('../../serviceAccountKey.json');
    app = initializeApp({
        credential: cert(serviceAccount)
    });
    console.log('[Firebase] Admin SDK initialized successfully');
} catch (error) {
    console.error('[Firebase] Error initializing Admin SDK. Check serviceAccountKey.json path.', error);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken || !app) return false;
    
    const message = {
        notification: { title, body },
        data,
        token: fcmToken
    };

    try {
        const response = await getMessaging().send(message);
        console.log('[Firebase] Successfully sent message:', response);
        return true;
    } catch (error) {
        console.error('[Firebase] Error sending message:', error);
        return false;
    }
};

module.exports = {
    sendPushNotification
};
