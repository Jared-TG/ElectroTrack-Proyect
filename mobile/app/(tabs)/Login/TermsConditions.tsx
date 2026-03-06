import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TermsConditionsScreen() {
    const router = useRouter();
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        if (accepted) {
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ELECTROTRACK</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Title */}
                <Text style={styles.pageTitle}>Términos y Condiciones</Text>
                <Text style={styles.lastUpdate}>Última actualización: 13 de febrero de 2026</Text>

                {/* Secciones */}
                <View>
                    {/* Sección 1 */}
                    <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
                    <Text style={styles.sectionText}>
                        Al acceder y utilizar la aplicación ELECTROTRACK, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra aplicación.
                    </Text>

                    {/* Sección 2 */}
                    <Text style={styles.sectionTitle}>2. Uso de la Aplicación</Text>
                    <Text style={styles.sectionText}>
                        ELECTROTRACK es una herramienta de monitoreo de consumo energético diseñada para uso personal y profesional. Al utilizar esta aplicación, usted se compromete a:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>Proporcionar información precisa y actualizada</Text>
                        <Text style={styles.bulletItem}>Mantener la confidencialidad de su cuenta</Text>
                        <Text style={styles.bulletItem}>No utilizar la aplicación para fines ilegales</Text>
                        <Text style={styles.bulletItem}>No intentar acceder a sistemas sin autorización</Text>
                    </View>

                    {/* Sección 3 */}
                    <Text style={styles.sectionTitle}>3. Privacidad y Datos</Text>
                    <Text style={styles.sectionText}>
                        Nos comprometemos a proteger su información personal. Los datos de consumo energético recopilados se utilizan exclusivamente para proporcionar los servicios de la aplicación. No compartimos su información con terceros sin su consentimiento expreso.
                    </Text>
                </View>

                {/* Secciones 4-10 (mismas que arriba, sin tarjeta) */}
                <Text style={styles.sectionTitle}>4. Mediciones y Precisión</Text>
                <Text style={styles.sectionText}>
                    ELECTROTRACK proporciona estimaciones de consumo energético basadas en los datos proporcionados por los sensores conectados. Si bien nos esforzamos por garantizar la precisión, no garantizamos que las mediciones sean 100% exactas. Las lecturas pueden variar según las condiciones de instalación y calibración de los dispositivos.
                </Text>

                {/* Sección 5 */}
                <Text style={styles.sectionTitle}>5. Limitación de Responsabilidad</Text>
                <Text style={styles.sectionText}>
                    ELECTROTRACK no se hace responsable de daños directos, indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de usar la aplicación. Esto incluye, pero no se limita a, pérdidas de datos, interrupciones del servicio o decisiones tomadas basándose en la información proporcionada por la aplicación.
                </Text>

                {/* Sección 6 */}
                <Text style={styles.sectionTitle}>6. Actualizaciones y Modificaciones</Text>
                <Text style={styles.sectionText}>
                    Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en la aplicación. Se le notificará sobre cambios significativos y su uso continuado de la aplicación constituirá la aceptación de los términos modificados.
                </Text>

                {/* Sección 7 */}
                <Text style={styles.sectionTitle}>7. Soporte Técnico</Text>
                <Text style={styles.sectionText}>
                    Ofrecemos soporte técnico limitado para la aplicación ELECTROTRACK. Para obtener asistencia, puede contactarnos a través de los canales oficiales proporcionados en la sección de configuración de la aplicación. No garantizamos tiempos de respuesta específicos.
                </Text>

                {/* Sección 8 */}
                <Text style={styles.sectionTitle}>8. Terminación del Servicio</Text>
                <Text style={styles.sectionText}>
                    Nos reservamos el derecho de suspender o terminar su acceso a ELECTROTRACK en cualquier momento, sin previo aviso, por conducta que consideremos viola estos Términos y Condiciones o es perjudicial para otros usuarios, nosotros o terceros.
                </Text>

                {/* Sección 9 */}
                <Text style={styles.sectionTitle}>9. Propiedad Intelectual</Text>
                <Text style={styles.sectionText}>
                    Todo el contenido, características y funcionalidades de ELECTROTRACK, incluyendo pero no limitado a texto, gráficos, logotipos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, son propiedad exclusiva de ELECTROTRACK y están protegidos por leyes internacionales de derechos de autor, marcas registradas, patentes, secretos comerciales y otras leyes de propiedad intelectual.
                </Text>

                {/* Sección 10 */}
                <Text style={styles.sectionTitle}>10. Jurisdicción y Ley Aplicable</Text>
                <Text style={styles.sectionText}>
                    Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes aplicables, sin tener en cuenta sus disposiciones sobre conflictos de leyes. Cualquier disputa relacionada con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales competentes.
                </Text>
                <Text style={[styles.sectionText, { marginTop: 12 }]}>
                    Si alguna disposición de estos términos se considera inválida o inaplicable, las disposiciones restantes permanecerán en pleno vigor y efecto.
                </Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Checkbox */}
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setAccepted(!accepted)}>
                    <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                        {accepted && <Ionicons name="checkmark" size={16} color="#000" />}
                    </View>
                    <Text style={styles.checkboxText}>
                        He leído y acepto los Términos y Condiciones de uso de ELECTROTRACK. Entiendo que al continuar estoy aceptando estos términos legalmente vinculantes.
                    </Text>
                </TouchableOpacity>

                {/* Accept Button */}
                <TouchableOpacity
                    style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
                    onPress={handleAccept}
                    disabled={!accepted}
                >
                    <Text style={[styles.acceptButtonText, !accepted && styles.acceptButtonTextDisabled]}>
                        Aceptar y Continuar
                    </Text>
                </TouchableOpacity>

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
        paddingBottom: 40,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 1.5,
    },
    // Title
    pageTitle: {
        fontSize: 26,
        fontWeight: '700',
        fontStyle: 'italic',
        color: '#FFD700',
        marginBottom: 8,
    },
    lastUpdate: {
        fontSize: 13,
        color: '#888',
        marginBottom: 24,
    },

    // Section
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFD700',
        marginBottom: 10,
        marginTop: 20,
    },
    sectionText: {
        fontSize: 14,
        color: '#CCC',
        lineHeight: 22,
    },
    // Bullet List
    bulletList: {
        marginTop: 8,
        paddingLeft: 16,
    },
    bulletItem: {
        fontSize: 14,
        color: '#CCC',
        lineHeight: 24,
        paddingLeft: 4,
    },
    // Divider
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 24,
    },
    // Checkbox
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#666',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    checkboxText: {
        flex: 1,
        fontSize: 13,
        color: '#AAA',
        lineHeight: 20,
    },
    // Accept Button
    acceptButton: {
        backgroundColor: '#333',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    acceptButtonDisabled: {
        opacity: 0.5,
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFD700',
    },
    acceptButtonTextDisabled: {
        color: '#888',
    },
});
