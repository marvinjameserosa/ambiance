from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import random
import sensor

app = Flask(__name__)
CORS(app)

@app.route('/')
def get_sensor_data():
    data = sensor.data_dict
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=False)