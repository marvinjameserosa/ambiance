import serial
import threading
import time
import datetime
import pandas as pd
import os

class SensorErrorType:
    NO_ERROR = 'NO_ERROR'
    SENSOR_READ_ERROR = 'SENSOR_READ_ERROR'
    DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR'
    COMMUNICATION_ERROR = 'COMMUNICATION_ERROR'
    PORT_NOT_SET = 'PORT_NOT_SET'

# Global configuration
PORT = "/dev/ttyUSB0"
BAUDRATE = 9600
DELAY = 1
CSV_FILE = 'sensor_data.csv'

data_dict = {
    'exception': SensorErrorType.NO_ERROR,
    'location': None,
    'timestamp': '',
    'date': '',
    'temperature': None,
    'pressure': None,
    'humidity': None,
    'pm1': None,
    'pm2': None,
    'pm10': None,
    'gas': None,
    'tvoc': None,
    'eco2': None
}

def parse_numeric_value(value):
    """
    Robust numeric value parsing
    """
    try:
        cleaned_value = ''.join(char for char in str(value) if char.isdigit() or char in '.-')
        return float(cleaned_value)
    except (ValueError, TypeError):
        print(f"Could not parse numeric value: {value}")
        return None

def validate_sensor_data(data_dict):
    """
    Check if sensor data is within acceptable ranges
    """
    sensor_ranges = {
        'temperature': (-50, 100),  # Celsius
        'pressure': (800, 1200),    # hPa
        'humidity': (0, 100),       # Percentage
        'pm1': (0, 10000),          # µg/m³
        'pm2': (0, 10000),          # µg/m³
        'pm10': (0, 10000),         # µg/m³
        'gas': (0, 10000),          # kΩ
        'tvoc': (0, 10000),         # ppb
        'eco2': (0, 10000)          # ppm
    }

    for key, (min_val, max_val) in sensor_ranges.items():
        value = data_dict.get(key)
        if value is not None:
            if value < min_val or value > max_val:
                return SensorErrorType.DATA_VALIDATION_ERROR

    return SensorErrorType.NO_ERROR

def read_sensor_data():
    """
    Read sensor data from serial port
    """
    global data_dict
    
    try:
        with serial.Serial(port=PORT, baudrate=BAUDRATE, timeout=1) as ser:
            while True:
                try:
                    # Read a line from serial
                    raw_data = ser.readline().decode('utf-8').strip()
                    
                    # Split the data
                    parts = raw_data.split(':')
                    
                    # Ensure we have a valid key-value pair
                    if len(parts) == 2:
                        key = parts[0].strip().lower()
                        value = parts[1].strip()
                        
                        # Key mapping dictionary
                        key_mapping = {
                            'location':'location',
                            'temp': 'temperature',
                            'temperature': 'temperature',
                            'pm1.0': 'pm1',
                            'pm2.5': 'pm2',
                            'pm10': 'pm10',
                            'gas resistance': 'gas',
                            'tvoc': 'tvoc',
                            'eco2': 'eco2',
                            'pressure': 'pressure',
                            'humidity': 'humidity'
                        }
                        
                        # Normalize the key
                        normalized_key = key_mapping.get(key, key)
                        
                        # Update data if key exists in dictionary
                        if normalized_key in data_dict:
                            # Special handling for location (string value)
                            if normalized_key == 'location':
                                data_dict[normalized_key] = value
                            else:
                                # Parse and convert numeric values for everything else
                                data_dict[normalized_key] = parse_numeric_value(value)
                    
                    # Update timestamp and date
                    current_time = datetime.datetime.now()
                    data_dict['timestamp'] = current_time.isoformat()
                    data_dict['date'] = current_time.strftime("%Y-%m-%d %H:%M:%S")
                    
                    # Validate entire sensor data set
                    data_dict['exception'] = validate_sensor_data(data_dict)
                    
                    # Optional: Write to CSV
                    to_csv()
                    
                    # Small delay to prevent overwhelming the system
                    time.sleep(0.1)
                    
                except Exception as e:
                    print(f"Error reading sensor data: {e}")
                    data_dict['exception'] = SensorErrorType.SENSOR_READ_ERROR
                    time.sleep(DELAY)
    
    except serial.SerialException as e:
        print(f"Serial port error: {e}")
        data_dict['exception'] = SensorErrorType.COMMUNICATION_ERROR
        time.sleep(DELAY)
    except Exception as e:
        print(f"Unexpected error: {e}")
        data_dict['exception'] = SensorErrorType.COMMUNICATION_ERROR
        time.sleep(DELAY)

def to_csv():
    """
    Write sensor data to CSV
    """
    try:
        df = pd.DataFrame([data_dict])
        df.to_csv(CSV_FILE, mode='a', header=not os.path.isfile(CSV_FILE), index=False)
    except Exception as e:
        print(f"Error in to_csv function: {e}")

def start_sensor_reading():
    """
    Start sensor reading in a separate thread
    """
    sensor_thread = threading.Thread(target=read_sensor_data, daemon=True)
    sensor_thread.start()

start_sensor_reading()