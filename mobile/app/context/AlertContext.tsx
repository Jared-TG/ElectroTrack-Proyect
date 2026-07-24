import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ===== Types =====
type AlertType = 'success' | 'error' | 'info';

interface AlertConfig {
    type: AlertType;
    title: string;
    message?: string;
    buttonText?: string;
    onDismiss?: () => void;
}

interface AlertContextType {
    showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType>({
    showAlert: () => { },
});

// ===== Theme config per type =====
const ALERT_THEMES: Record<AlertType, { borderColor: string; iconName: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
    success: {
        borderColor: '#4CAF50',
        iconName: 'checkmark-circle',
        iconColor: '#4CAF50',
    },
    error: {
        borderColor: '#FF4444',
        iconName: 'close-circle',
        iconColor: '#FF4444',
    },
    info: {
        borderColor: '#FFD700',
        iconName: 'information-circle',
        iconColor: '#FFD700',
    },
};

// ===== Provider =====
export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertConfig | null>(null);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const showAlert = useCallback((alertConfig: AlertConfig) => {
        setConfig(alertConfig);
        setVisible(true);

        // Animate in
        scaleAnim.setValue(0.7);
        opacityAnim.setValue(0);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [scaleAnim, opacityAnim]);

    const dismiss = useCallback(() => {
        // Animate out
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.7,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            config?.onDismiss?.();
            setConfig(null);
        });
    }, [scaleAnim, opacityAnim, config]);

    const theme = config ? ALERT_THEMES[config.type] : ALERT_THEMES.info;

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={dismiss}
            >
                <TouchableWithoutFeedback onPress={dismiss}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.alertCard,
                                    {
                                        borderColor: theme.borderColor,
                                        transform: [{ scale: scaleAnim }],
                                        opacity: opacityAnim,
                                    },
                                ]}
                            >
                                {/* Icon + Content */}
                                <View style={styles.contentRow}>
                                    <View style={[styles.iconCircle, { backgroundColor: theme.borderColor + '20' }]}>
                                        <Ionicons
                                            name={theme.iconName}
                                            size={36}
                                            color={theme.iconColor}
                                        />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.title}>{config?.title}</Text>
                                        {config?.message ? (
                                            <Text style={styles.message}>{config.message}</Text>
                                        ) : null}
                                    </View>
                                </View>

                                {/* Button */}
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: theme.borderColor }]}
                                    onPress={dismiss}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.buttonText}>
                                        {config?.buttonText || 'OK'}
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </AlertContext.Provider>
    );
}

export function useAlert() {
    return useContext(AlertContext);
}

// ===== Styles =====
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    alertCard: {
        width: width - 60,
        backgroundColor: '#111',
        borderRadius: 16,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#AAA',
        lineHeight: 20,
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontFamily: 'Inter_700Bold',
        color: '#000',
    },
});
