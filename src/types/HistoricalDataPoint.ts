import { SensorData } from "./SensorData"

export interface HistoricalDataPoint extends SensorData {
    id: number
    secondsAgo: number
}