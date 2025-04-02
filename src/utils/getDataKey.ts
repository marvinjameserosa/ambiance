import { SensorData } from '@/types/SensorData'

export const getDataKey = (label: string): keyof SensorData => {
    const mapping: { [key: string]: keyof SensorData } = {
      'TEMPERATURE': 'temperature',
      'PRESSURE': 'pressure',
      'HUMIDITY': 'humidity',
      'PM 1.0': 'pm1',
      'PM 2.5': 'pm2',
      'PM 10': 'pm10',
      'ECO2': 'eco2',
      'GAS': 'gas',
      'TVOC': 'tvoc'
    }
    return mapping[label]
}