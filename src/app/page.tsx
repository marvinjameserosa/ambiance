'use client'
import React, { useEffect, useState } from 'react'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatePresence, motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SensorData } from '@/types/SensorData'
import { HistoricalDataPoint } from '@/types/HistoricalDataPoint'
import { getDataKey } from '@/utils/getDataKey'
import { getThresholds } from '@/utils/getThresholds'
import { calculateTrend } from '@/utils/calculateTrend'
import { AlertCircle, XCircle, WifiOff, Info, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import Image from 'next/image'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ErrorState {
  type: 'connection' | 'server' | 'sensor' | null
  message: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    payload: HistoricalDataPoint
  }>
  label?: string
}
interface SensorInfo {
  [key: string]: {
    description: string;
    healthImplications: string;
    normalRange: string;
  }
}

const sensorInfo: SensorInfo = {
  'TEMPERATURE': {
    description: 'Ambient air temperature in degrees Celsius.',
    healthImplications: 'Extreme temperatures can affect comfort, productivity, and in severe cases, health.',
    normalRange: '15-30°C is generally comfortable for indoor environments.',
  },
  'PRESSURE': {
    description: 'Atmospheric pressure measured in hectopascals (hPa).',
    healthImplications: 'Rapid pressure changes can cause headaches in sensitive individuals.',
    normalRange: '980-1020 hPa is typical at sea level.',
  },
  'HUMIDITY': {
    description: 'Amount of water vapor in the air, expressed as a percentage.',
    healthImplications: 'Low humidity can cause dry skin and respiratory issues. High humidity promotes mold growth.',
    normalRange: '30-70% is recommended for indoor comfort and health.',
  },
  'PM 1.0': {
    description: 'Particulate matter with diameter less than 1.0 micrometers.',
    healthImplications: 'These tiny particles can penetrate deep into lungs and bloodstream.',
    normalRange: 'Below 50 µg/m³ is considered acceptable.',
  },
  'PM 2.5': {
    description: 'Particulate matter with diameter less than 2.5 micrometers.',
    healthImplications: 'Can cause respiratory and cardiovascular issues with long-term exposure.',
    normalRange: 'Below 35 µg/m³ is recommended by many health authorities.',
  },
  'PM 10': {
    description: 'Particulate matter with diameter less than 10 micrometers.',
    healthImplications: 'Can irritate eyes, nose, and throat, and worsen asthma symptoms.',
    normalRange: 'Below 50 µg/m³ is generally considered acceptable.',
  },
  'ECO2': {
    description: 'Equivalent CO₂ - estimated carbon dioxide level in parts per million.',
    healthImplications: 'High levels can cause drowsiness, headaches, and reduced cognitive function.',
    normalRange: '400-1000 ppm indicates good ventilation.',
  },
  'GAS': {
    description: 'Gas resistance measurement, lower values indicate higher gas concentration.',
    healthImplications: 'Detects volatile organic compounds and other gases that may impact air quality.',
    normalRange: 'Varies by environment, but higher resistance (kΩ) generally indicates cleaner air.',
  },
  'TVOC': {
    description: 'Total Volatile Organic Compounds in parts per billion.',
    healthImplications: 'VOCs can cause eye, nose, and throat irritation, headaches, and organ damage.',
    normalRange: 'Below 500 ppb is generally considered acceptable.',
  }
};

const ErrorDisplay: React.FC<{ error: ErrorState }> = ({ error }) => {
  const errorConfig = {
    connection: { icon: WifiOff, color: 'text-orange-500', bgColor: 'bg-orange-50/50', borderColor: 'border-orange-200' },
    server: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50/50', borderColor: 'border-red-200' },
    sensor: { icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-50/50', borderColor: 'border-yellow-200' }
  }
  const config = error.type ? errorConfig[error.type] : errorConfig.server
  return (
    <Alert className={`${config.bgColor} ${config.borderColor} mb-1 py-1.5 px-2`}> 
      <div className="flex items-center space-x-1.5 text-xs"> 
        <config.icon className={`h-3 w-3 ${config.color} flex-shrink-0`} /> 
        <span className={`${config.color} font-medium`}>
          {error.message}
        </span>
      </div>
    </Alert>
  )
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const dataKey = payload[0].dataKey as keyof SensorData;
    const sensorLabel = Object.keys(sensorInfo).find(key => 
      dataKey === key.toLowerCase() || 
      dataKey === key.toLowerCase().replace(/\s|\./g, '')
    );
    
    const thresholds = getThresholds(sensorLabel || '');
    let statusColor = 'text-green-600';
    let statusText = 'Normal';
    
    if (value < thresholds.min) {
      statusColor = 'text-blue-600';
      statusText = 'Below Range';
    } else if (value > thresholds.max) {
      statusColor = 'text-red-600';
      statusText = 'Above Range';
    }
    
    return (
      <div className="rounded-2xl shadow-lg border border-gray-200 bg-white p-3">
        <p className="text-sm font-medium text-gray-700">{`${label} seconds ago`}</p>
        <p className="text-base font-semibold text-gray-800">{`${value.toFixed(1)}`}</p>
        <p className={`text-xs font-medium ${statusColor}`}>{statusText}</p>
      </div>
    )
  }
  return null
}

const SensorCard = ({ label, value, icon, historicalData }: { label: string; value: number | undefined; icon: string; historicalData: HistoricalDataPoint[] }) => {
  const formatValue = (val: number | undefined) => (val === undefined ? 'N/A' : val.toFixed(1))
  
  const getUnit = (label: string) => {
    const units: { [key: string]: string } = {
      'TEMPERATURE': '°C',
      'PRESSURE': 'hPa',
      'HUMIDITY': '%',
      'PM 1.0': 'µg/m³',
      'PM 2.5': 'µg/m³',
      'PM 10': 'µg/m³',
      'ECO2': 'ppm',
      'GAS': 'kΩ',
      'TVOC': 'ppb'
    }
    return units[label] || ''
  }
  
  const thresholds = getThresholds(label);
  
  const getValueColor = (val: number | undefined) => {
    if (val === undefined) return 'text-gray-400';
    if (val < thresholds.min) return 'text-blue-600';
    if (val > thresholds.max) return 'text-red-600';
    return 'text-green-600';
  }
  
  const getBgColor = (val: number | undefined) => {
    if (val === undefined) return 'bg-gray-50';
    if (val < thresholds.min) return 'bg-blue-50';
    if (val > thresholds.max) return 'bg-red-50';
    return 'bg-green-50';
  }
  
  const getStatusMessage = (val: number | undefined) => {
    if (val === undefined) return 'No data available';
    if (val < thresholds.min) return `Low (< ${thresholds.min})`;
    if (val > thresholds.max) return `High (> ${thresholds.max})`;
    return `Normal (${thresholds.min}-${thresholds.max})`;
  }
  
  const getStatusIcon = (val: number | undefined) => {
    if (val === undefined) return AlertCircle;
    if (val < thresholds.min) return TrendingDown;
    if (val > thresholds.max) return TrendingUp;
    return CheckCircle;
  }
  
  const trend = calculateTrend(historicalData, label);
  const StatusIcon = getStatusIcon(value);
  const dataKey = getDataKey(label);
  const info = sensorInfo[label] || { description: '', healthImplications: '', normalRange: '' };
  
  // Calculate min, max, and average from historical data
  const stats = historicalData.length > 0 ? historicalData.reduce((acc, point) => {
    const val = point[dataKey];
    if (typeof val !== 'number' || isNaN(val)) return acc;
    
    return {
      min: Math.min(acc.min, val),
      max: Math.max(acc.max, val),
      sum: acc.sum + val,
      count: acc.count + 1
    };
  }, { min: Infinity, max: -Infinity, sum: 0, count: 0 }) : { min: 0, max: 0, sum: 0, count: 0 };
  
  const average = stats.count > 0 ? stats.sum / stats.count : 0;
  
  return (
    <Card className={`h-full flex flex-col border-l-4 ${getValueColor(value).replace('text-', 'border-')}`}>
      <CardHeader className="p-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative flex items-center justify-center flex-shrink-0">
              <Image 
                src={icon} 
                alt={label} 
                width={24} 
                height={24} 
                className="object-contain"
              />
            </div>
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600">
                <Info className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <h4 className="font-medium mb-2">{label}</h4>
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">{info.description}</p>
                  <p className="text-xs"><span className="font-medium">Normal Range:</span> {info.normalRange}</p>
                  <p className="text-xs"><span className="font-medium">Health Implications:</span> {info.healthImplications}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-0 pb-2 flex-1 min-h-0">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-1">
            <div className={`rounded-lg p-1.5 ${getBgColor(value)} flex-1`}>
              <div className="flex items-center justify-between">
                <div className={`text-xl font-bold ${getValueColor(value)}`}>
                  {formatValue(value)} {getUnit(label)}
                </div>
                {trend !== 'stable' && (
                  <div className="flex items-center">
                    {trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <StatusIcon className={`h-3 w-3 ${getValueColor(value)}`} />
                <span className={`text-xs font-medium ${getValueColor(value)}`}>
                  {getStatusMessage(value)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats summary */}
          {historicalData.length > 0 && (
            <div className="grid grid-cols-3 gap-1 mb-1 text-center">
              <div className="bg-gray-50 rounded p-0.5">
                <div className="text-xs text-gray-500">Min</div>
                <div className="text-xs font-medium">{stats.min.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 rounded p-0.5">
                <div className="text-xs text-gray-500">Avg</div>
                <div className="text-xs font-medium">{average.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 rounded p-0.5">
                <div className="text-xs text-gray-500">Max</div>
                <div className="text-xs font-medium">{stats.max.toFixed(1)}</div>
              </div>
            </div>
          )}
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -5, bottom: 5 }}>
                <YAxis domain={[thresholds.min, thresholds.max]} tick={{ fontSize: 9 }} width={25} />
                <XAxis dataKey="secondsAgo" tick={{ fontSize: 9 }} tickFormatter={(v) => `-${v}s`} reversed />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={thresholds.min} stroke="#3b82f6" strokeDasharray="3 3" />
                <ReferenceLine y={thresholds.max} stroke="#ef4444" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke="#2563eb" 
                  strokeWidth={1.5} 
                  dot={false} 
                  isAnimationActive 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<SensorData | null>(null)
  const [prevData, setPrevData] = useState<SensorData | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([])
  const [error, setError] = useState<ErrorState>({ type: null, message: '' })
  
  const handleError = (err: unknown, responseData?: any): ErrorState => {
    if (!navigator.onLine) {
      return {
        type: 'connection',
        message: 'Please check your internet connection and try again.'
      };
    }
    if (responseData && responseData.exception) {
      const exceptionMapping: Record<string, ErrorState> = {
        'SENSOR_READ_ERROR': {
          type: 'sensor',
          message: 'Error reading   . Please check sensor connections.'
        },
        'DATA_VALIDATION_ERROR': {
          type: 'sensor',
          message: 'Sensor data is out of expected range. Calibration may be needed.'
        },
        'COMMUNICATION_ERROR': {
          type: 'server',
          message: 'Communication error with sensor. Our team has been notified.'
        },
        'PORT_NOT_SET': {
          type: 'server',
          message: 'Sensor port configuration error. Please contact support.'
        }
      };

      const mappedError = exceptionMapping[responseData.exception];
      if (mappedError) return mappedError;
    }

    // Fallback error handling
    return {
      type: 'server',
      message: 'Unable to fetch sensor data. Please try again later.'
    };
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch sensor data');
        }
        
        const newData = await response.json();
        
        if (newData.exception && newData.exception !== 'NO_ERROR') {
          setError(handleError(null, newData));
          return;
        }
        const invalidSensors = Object.entries(newData).filter(([key, value]) => {
          if (key === 'timestamp' || key === 'exception' || key === 'date' || key === 'location') return false
          return value === null || value === undefined || (typeof value === 'string')
        })

        if (invalidSensors.length > 0) {
          setError({
            type: 'sensor',
            message: `Invalid readings from ${invalidSensors.map(([key]) => key).join(', ')}`
          });
          return;
        }

        setError({ type: null, message: '' })
        setPrevData(data)
        setData(newData)
        
        const now = Date.now()
        setHistoricalData(prev => {
          const newPoint = { 
            ...newData, 
            id: now,
            secondsAgo: 0 
          }
          const updated = [...prev, newPoint]
            .map(point => ({
              ...point,
              secondsAgo: Math.round((now - point.id) / 1000)
            }))
            .slice(-20)
          return updated
        })
      } catch (err) {
        setError(handleError(err));
      }
    }

    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const sensors = [
    { label: 'TEMPERATURE', value: data?.temperature, icon: '/temperature.svg' },
    { label: 'PRESSURE', value: data?.pressure, icon: '/pressure.svg' },
    { label: 'HUMIDITY', value: data?.humidity, icon: '/humidity.svg' },
    { label: 'PM 1.0', value: data?.pm1, icon: '/pm1.svg' },
    { label: 'PM 2.5', value: data?.pm2, icon: '/pm2.svg' },
    { label: 'PM 10', value: data?.pm10, icon: '/pm10.svg' },
    { label: 'ECO2', value: data?.eco2, icon: '/eCO2.svg' },
    { label: 'GAS', value: data?.gas, icon: '/gas.svg' },
    { label: 'TVOC', value: data?.tvoc, icon: '/TVOC.svg' }
  ];

  return (
    <div className="h-screen flex flex-col">
      <Header timestamp={data?.timestamp} location={data?.location as string} />
      <main className="flex-1 p-2 overflow-auto">
        <AnimatePresence mode="wait">
          {error.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ErrorDisplay error={error} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 auto-rows-fr">
          {sensors.map((sensor) => (
            <motion.div
              key={sensor.label}
              initial={false}
              animate={{ 
                scale: prevData && data && 
                prevData[sensor.label.toLowerCase() as keyof SensorData] !== 
                data[sensor.label.toLowerCase() as keyof SensorData] ? [1, 1.02, 1] : 1
              }}
              transition={{ duration: 0.3 }}
              className="h-72 sm:h-80 md:h-64"
            >
              <SensorCard
                label={sensor.label}
                value={sensor.value}
                icon={sensor.icon}
                historicalData={historicalData}
              />
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}