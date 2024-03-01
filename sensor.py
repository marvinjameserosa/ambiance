import serial
def sensor_data():
    data_dict = {'exception':'', 
    'location':'NO LOCATION',
    'temperature':'None',
    'pressure':'None',
    'humidity':'None',
    'TVOC':'None',
    'ECO2':'None'
    }
    error = "An error has occurred. Please kindly contact your administrator for further assistance. Error Message: "
    try:
        ser = serial.Serial(port='COM4', baudrate=9600)
        data_dict['exception'] = ''
        raw_data = ser.readline().decode('utf-8').strip()
        data = raw_data.split(':')
        data_dict[data[0]] = data[1]
    except serial.SerialException as e:
        error = error + str(e)
        data_dict['exception'] = error
    
    return data_dict

