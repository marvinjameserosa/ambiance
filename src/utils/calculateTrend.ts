import { HistoricalDataPoint } from '@/types/HistoricalDataPoint';
import { getDataKey } from '@/utils/getDataKey'
import { getThresholds } from './getThresholds'



export const calculateTrend = (data: HistoricalDataPoint[], label: string): 'up' | 'down' | 'stable' => {
    if (!data || data.length < 2) return 'stable';

    const dataKey = getDataKey(label);
    const lastFivePoints = data.slice(-5);

    if (lastFivePoints.length < 2) return 'stable';

    const first = lastFivePoints[0][dataKey];
    const last = lastFivePoints[lastFivePoints.length - 1][dataKey];

    if (typeof first !== 'number' || typeof last !== 'number') return 'stable';

    const difference = last - first;
    const thresholds = getThresholds(label);
    const range = thresholds.max - thresholds.min;
    const significantChange = range * 0.05; // 5% of range is considered significant

    if (difference > significantChange) return 'up';
    if (difference < -significantChange) return 'down';

    return 'stable';
}