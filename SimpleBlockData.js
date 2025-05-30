var JSON_Data = {
    "arrangements":{
        "Cargo Hold": {
            "length":'',
            "width":'',
            "height":'',
            "x":'',
            "y":'',
            "z":'',
            "min_x":1.5,
            "max_x":4,
            "min_y":-3.1,
            "max_y":3.1,
            "min_z": 2.613,
            "max_z": 4.287,
            "color":"brown",
        },
        "Control Room": {
            "length":'',
            "width":'',
            "height":'',
            "x":'',
            "y":'',
            "z":'',
            "min_x": 14,
            "max_x": 17,
            "min_y": -2.6,
            "max_y": 4.8,
            "min_z": 2.613,
            "max_z": 4.287,
            "color":"aquamarine",
        },
    },
    "structure": {
        "hull": {
            "attributes": {
                "LPP": 33.9,
                "LOA": 36.25,
                "Breadth": 9.6,
                "DWL": 2.5,
                "WindFrontalProjectedArea": 82.53,
                "WindLateralProjectedArea": 185.23,
                "DepthFirstDeck": 4.287,
                "DepthADeck": 6.687,
                "DraughtNorm": 2.50,
                "DraughtMax": 2.787,
                "DraughtScant": 2.90,
                "GrossTonnage": 430,
                "FrameDistance": 500,
                "KB":1.654,
                "GM":1.608,
                "MCR":'',
                "crew":'',
                "speed":'',

            },
            "halfBreadths": {
                "waterlines": [0, 1, 2, 3, 4, 5, 6, 7, 7.65, 10, 12, 14, 16],
                "stations": [-0.59, -0.26, 0, 0.24, 0.52, 0.76, 1, 1.26, 1.52, 1.77, 2.02, 2.28, 2.53, 2.78, 3.04, 3.29, 3.54, 3.8, 4.04, 4.31, 4.55, 4.82, 5.04, 5.32, 5.56, 5.83, 6.06, 6.34, 6.6, 6.84, 7.07, 7.36, 7.58, 7.86, 8.09, 8.38, 8.59, 8.88, 9.1, 9.38, 9.61, 9.9, 10.15, 10.41],
                "table": [
                    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 2.2, 5.66437, 7.96552, 9.12874, 9.25517, 9.25517, 8.97701, 8.26897, 7.45977, 6.34713, 5.2092, 4.04598, 2.98391, 2.09885, 1.51724, 1.01149, 0.78391, 0.65747, 0.68276, 0.68276, 0.35402, null, null, null, null, null, null, null],
					[null, null, null, null, null, null, null, null, null, null, null, 0.68276, 3.74253, 6.34713, 8.09195, 9.28046, 10.01379, 10.46897, 10.67126, 10.82299, 10.82299, 10.82299, 10.77241, 10.57011, 10.34253, 9.91264, 9.33103, 8.54713, 7.68736, 6.62529, 5.71494, 4.47586, 3.61609, 2.65517, 2.09885, 1.74483, 1.56782, 1.3908, 0.78391, null, null, null, null, null],
					[null, null, null, null, null, null, null, null, null, 0.70805, 3.81839, 6.8023, 8.3954, 9.4069, 10.06437, 10.54483, 10.7977, 10.94943, 11, 11, 11, 11, 11, 10.97471, 10.92414, 10.7977, 10.49425, 10.08966, 9.45747, 8.72414, 7.96552, 6.75172, 5.63908, 4.29885, 3.36322, 2.4023, 1.87126, 1.54253, 0.98621, null, null, null, null, null],
					[null, null, null, null, null, null, null, null, 3.0092, 5.96782, 8.09195, 9.28046, 10.01379, 10.46897, 10.77241, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.72184, 10.3931, 9.96322, 9.35632, 8.47126, 7.56092, 6.06897, 4.98161, 3.56552, 2.65517, 1.87126, 1.23908, null, null, null, null, null],
					[null, null, null, null, null, null, null, 4.14713, 7.28276, 8.8, 9.71035, 10.26667, 10.67126, 10.87356, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.87356, 10.64598, 10.29195, 9.63448, 8.90115, 7.76322, 6.62529, 5.28506, 4.07126, 2.70575, 1.84598, null, null, null, null, null],
					[null, null, null, null, null, 1.54253, 5.7908, 8.14253, 9.35632, 10.03908, 10.49425, 10.7977, 10.97471, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.82299, 10.44368, 9.91264, 9.02759, 8.11724, 6.85287, 5.76552, 4.22299, 3.13563, 1.44138, null, null, null, null],
					[null, null, null, null, 3.23678, 7.0046, 9.0023, 9.78621, 10.31724, 10.67126, 10.87356, 10.97471, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.87356, 10.62069, 10.08966, 9.38161, 8.24368, 7.30805, 5.74023, 4.62759, 3.03448, 1.66897, null, null, null],
					[null, null, 0.12644, 5.33563, 8.44598, 9.53333, 10.1908, 10.54483, 10.82299, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.72184, 10.24138, 9.50805, 8.62299, 7.23218, 6.1954, 4.57701, 3.31264, 1.08736, null, null],
					[null, 2.8, 7, 8.57241, 9.68506, 10.24138, 10.5954, 10.82299, 11.02529, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.87356, 10.64598, 10.08966, 9.4069, 8.11724, 7.10575, 5.48736, 4.29885, 2.27586, null, null],
					[10.31724, 10.62069, 10.7977, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.84828, 10.51954, 9.73563, 8.82529, 7.38391, 6.1954, 4.34943, 2.6046, null],
					[11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11.02529, 10.7977, 10.29195, 9.65977, 8.54713, 7.4092, 5.7908, 4.07126, 1.11264],
					[11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.97471, 10.89885, 10.5954, 10.1908, 9.38161, 8.49655, 7.2069, 5.71494, 3.41379],
					[11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10.92414, 10.54483, 10.21609, 9.50805, 8.77471, 7.51035, 6.22069, 4.07126]
				]
            },
        },
    },
    "shipState" :{

    },
}


export default JSON_Data;

function getOffsetData()
{
    var Waterline = JSON_Data["structure"]["hull"]["halfBreadths"]["waterlines"];
    var WaterLineList = document.getElementById("waterlines");
    WaterLineList.innerText = 'Waterlines: ' + Waterline;
    
    var Buttockline = JSON_Data["structure"]["hull"]["halfBreadths"]["table"];
    var ButtockLineList = document.getElementById("buttocklines");
    ButtockLineList.innerText = 'Buttocklines: ' + Buttockline;
    
    var Stations = JSON_Data["structure"]["hull"]["halfBreadths"]["stations"];
    var StationsList = document.getElementById("stations");
    StationsList.innerText = 'Stations: ' + Stations;

    return [Waterline, Buttockline, Stations];
}

