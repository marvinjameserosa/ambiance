export const getThresholds = (label: string) => {
    const thresholds = {
      'TEMPERATURE': { min: 15, max: 30 },
      'PRESSURE': { min: 980, max: 1020 },
      'HUMIDITY': { min: 30, max: 70 },
      'PM 1.0': { min: 0, max: 50 },
      'PM 2.5': { min: 0, max: 35 },
      'PM 10': { min: 0, max: 50 },
      'ECO2': { min: 400, max: 1000 },
      'GAS': { min: 0, max: 1000 },
      'TVOC': { min: 0, max: 500 }
    }
    return thresholds[label as keyof typeof thresholds] || { min: 0, max: 100 };
}