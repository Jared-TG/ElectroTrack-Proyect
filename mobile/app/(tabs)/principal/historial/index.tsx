import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHistorial } from '@/app/hooks/useHistorial';
import { MonthData } from '@/app/services/historialService';
import DatePickerModal from '@/app/components/DatePickerModal';

const MAX_KWH = 500;

type SortKey = 'fecha' | 'kwh_desc' | 'kwh_asc' | 'costo_desc' | 'costo_asc';

const FILTER_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'fecha',      label: 'Fecha' },
    { key: 'kwh_desc',   label: 'Mayor consumo' },
    { key: 'kwh_asc',    label: 'Menor consumo' },
    { key: 'costo_desc', label: 'Mayor costo' },
    { key: 'costo_asc',  label: 'Menor costo' },
];

function sortMonths(months: MonthData[], sortBy: SortKey): MonthData[] {
    const copy = [...months];
    switch (sortBy) {
        case 'kwh_desc':   return copy.sort((a, b) => b.kwh - a.kwh);
        case 'kwh_asc':    return copy.sort((a, b) => a.kwh - b.kwh);
        case 'costo_desc': return copy.sort((a, b) => b.costo - a.costo);
        case 'costo_asc':  return copy.sort((a, b) => a.costo - b.costo);
        default:           return copy; // 'fecha' → orden original de la API
    }
}

export default function HistorialScreen() {
    const router = useRouter();
    const { months, totalKwh, totalCost, avgKwh, loading, error, refetch } = useHistorial();
    const [sortBy, setSortBy] = useState<SortKey>('fecha');
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [filterMonth, setFilterMonth] = useState<string | null>(null);
    const [filterYear, setFilterYear] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        if (refetch) await refetch();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={{ color: '#AAA', marginTop: 12 }}>Cargando historial...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
                <Text style={{ color: '#FF4444', marginTop: 12, textAlign: 'center' }}>{error}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: '#FFD700' }}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Filtrar localmente en memoria
    const filteredMonths = months.filter(item => {
        let match = true;
        if (filterMonth && item.mes !== filterMonth) match = false;
        if (filterYear && item.anio.toString() !== filterYear) match = false;
        return match;
    });

    const sortedMonths = sortMonths(filteredMonths, sortBy);

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#FFD700"
                        colors={['#FFD700']} 
                        progressBackgroundColor="#1A1A1A"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ELECTROTRACK</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Historial de consumo</Text>

                {/* Summary Cards Row */}
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, styles.summaryCardLeft]}>
                        <Text style={styles.summaryLabel}>Consumo total</Text>
                        <Text style={styles.summaryValue}>{totalKwh.toLocaleString()} kWh</Text>
                    </View>
                    <View style={[styles.summaryCard, styles.summaryCardRight]}>
                        <Text style={styles.summaryLabel}>Costo Total</Text>
                        <Text style={styles.summaryValue}>
                            ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Average Card */}
                <View style={styles.averageCard}>
                    <Text style={styles.averageLabel}>Consumo promedio por mes</Text>
                    <Text style={styles.averageValue}>{avgKwh} kWh</Text>
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <View style={styles.filterHeader}>
                        <View style={styles.monthHeader}>
                            <MaterialCommunityIcons name="calendar-month" size={24} color="#FFF" />
                            <Text style={styles.monthTitle}>
                                {filterMonth || filterYear ? `${filterMonth || ''} ${filterYear || ''}`.trim() : 'Meses'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersRow}
                >
                    {FILTER_OPTIONS.map(opt => {
                        const active = sortBy === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                                onPress={() => {
                                    setSortBy(opt.key);
                                    if (opt.key === 'fecha') {
                                        setDatePickerVisible(true);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Month Cards */}
                {sortedMonths.map((item) => (
                    <View key={item.id} style={styles.monthCard}>
                        <View style={styles.monthCardContent}>
                            <View style={styles.monthLeft}>
                                <Text style={styles.monthName}>{item.mes}</Text>
                                <Text style={styles.monthYear}>{item.anio}</Text>
                            </View>
                            <View style={styles.monthRight}>
                                <Text style={styles.monthCost}>
                                    ${item.costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.monthCurrency}>MXN</Text>
                            </View>
                        </View>
                        <Text style={styles.monthKwh}>{item.kwh} kWh</Text>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${Math.min((item.kwh / MAX_KWH) * 100, 100)}%` },
                                ]}
                            />
                        </View>
                    </View>
                ))}
                {/* Bottom padding for scrolling */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal Date Picker */}
            <DatePickerModal
                visible={isDatePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={(month, year) => {
                    setFilterMonth(month);
                    setFilterYear(year);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingBottom: 30,
        paddingTop: 50,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
        letterSpacing: 1.5,
    },
    // Section Title
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: '#FFD700',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // Summary Cards
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 12,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    summaryCardLeft: {
        backgroundColor: '#1A1A1A',
    },
    summaryCardRight: {
        backgroundColor: '#1A1A1A',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 8,
        fontFamily: 'Inter_400Regular',
    },
    summaryValue: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    // Average Card
    averageCard: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 24,
    },
    averageLabel: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 8,
        fontFamily: 'Inter_400Regular',
    },
    averageValue: {
        fontSize: 26,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    // Months Section
    filtersContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    monthTitle: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
        color: '#FFF',
    },
    // Filter Chips
    filtersRow: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 8,
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#444',
        backgroundColor: '#1A1A1A',
    },
    filterChipActive: {
        borderColor: '#FFD700',
        backgroundColor: '#2A2200',
    },
    filterChipText: {
        fontSize: 13,
        fontFamily: 'Inter_500Medium',
        color: '#888',
    },
    filterChipTextActive: {
        color: '#FFD700',
    },
    // Month Card
    monthCard: {
        marginHorizontal: 20,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    monthCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    monthLeft: {},
    monthName: {
        fontSize: 18,
        fontFamily: 'Inter_700Bold',
        color: '#FFF',
    },
    monthYear: {
        fontSize: 15,
        color: '#AAA',
        marginTop: 2,
        fontFamily: 'Inter_400Regular',
    },
    monthRight: {
        alignItems: 'flex-end',
    },
    monthCost: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#B8960A',
    },
    monthCurrency: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
        fontFamily: 'Inter_400Regular',
    },
    monthKwh: {
        fontSize: 13,
        color: '#AAA',
        marginBottom: 8,
        fontFamily: 'Inter_400Regular',
    },
    // Progress Bar
    progressBarBg: {
        height: 6,
        backgroundColor: '#333',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#B8960A',
        borderRadius: 3,
    },
});
