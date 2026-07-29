const admin = require('firebase-admin');
const path = require('path');

try {
    const serviceAccount = require('../../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('[Firebase] Admin SDK initialized successfully');
} catch (error) {
    console.error('[Firebase] Error initializing Admin SDK. Check serviceAccountKey.json path.', error);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) return false;
    
    const message = {
        notification: { title, body },
        data,
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('[Firebase] Successfully sent message:', response);
        return true;
    } catch (error) {
        console.error('[Firebase] Error sending message:', error);
        return false;
    }
};

module.exports = {
    admin,
    sendPushNotification
};
