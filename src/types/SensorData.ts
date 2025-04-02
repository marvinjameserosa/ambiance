export interface SensorData {
    location: string
    temperature: number
    pressure: number
    humidity: number
    pm1: number
    pm2: number
    pm10: number
    eco2: number
    gas: number
    tvoc: number
    timestamp: string
    [key: string]: number | string 
}