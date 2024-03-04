import serial

def sensor_data():
    data_dict = {
        'exception':'',
        'location':'NO LOCATION',
        'temperature':'None',
        'pressure':'None',
        'humidity':'None',
        'pm1':'None',
        'pm2':'None',
        'pm10':'None',
        'gas':'None',
        'tvoc':'None',
        'eco2':'None'
    }
    
    error = "An error has occurred. Please kindly contact your administrator for further assistance. Error Message: "
    
    try:
        ser = serial.Serial(port='COM4', baudrate=9600)
        data_dict['exception'] = ''
        
        for key in range(6):
            raw_data = ser.readline().decode('utf-8').strip()
            data = raw_data.split(':')
            data_dict[data[0]] = data[1]
                
    except serial.SerialException as e:
        error = error + str(e)
        data_dict['exception'] = error
    
    return data_dict

