"""SKYGUARD AI prototype API."""
from datetime import datetime, timezone
from enum import Enum
from typing import Any
import math
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SKYGUARD AI Prototype API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
STATIONS = [
    {"id":"AWS-001","station_code":"AWS-001","location":"Guwahati","district":"Assam","latitude":26.1445,"longitude":91.7362,"status":"Normal","health":98},
    {"id":"AWS-002","station_code":"AWS-002","location":"Shillong","district":"Meghalaya","latitude":25.5788,"longitude":91.8933,"status":"Normal","health":96},
    {"id":"AWS-003","station_code":"AWS-003","location":"Tezpur","district":"Assam","latitude":26.6528,"longitude":92.7926,"status":"Normal","health":94},
    {"id":"AWS-004","station_code":"AWS-004","location":"Silchar","district":"Assam","latitude":24.8333,"longitude":92.7789,"status":"Normal","health":97},
    {"id":"AWS-005","station_code":"AWS-005","location":"Agartala","district":"Tripura","latitude":23.8315,"longitude":91.2868,"status":"Normal","health":91},
    {"id":"AWS-006","station_code":"AWS-006","location":"Aizawl","district":"Mizoram","latitude":23.7271,"longitude":92.7176,"status":"Normal","health":95},
    {"id":"AWS-007","station_code":"AWS-007","location":"Imphal","district":"Manipur","latitude":24.817,"longitude":93.9368,"status":"Normal","health":93},
    {"id":"AWS-008","station_code":"AWS-008","location":"Kohima","district":"Nagaland","latitude":25.6751,"longitude":94.1086,"status":"Normal","health":96},
    {"id":"AWS-009","station_code":"AWS-009","location":"Dimapur","district":"Nagaland","latitude":25.8629,"longitude":93.753,"status":"Normal","health":90},
    {"id":"AWS-010","station_code":"AWS-010","location":"Itanagar","district":"Arunachal Pradesh","latitude":27.0844,"longitude":93.6053,"status":"Normal","health":94},
    {"id":"AWS-011","station_code":"AWS-011","location":"Pasighat","district":"Arunachal Pradesh","latitude":28.066,"longitude":95.326,"status":"Normal","health":92},
    {"id":"AWS-012","station_code":"AWS-012","location":"Dibrugarh","district":"Assam","latitude":27.4728,"longitude":94.912,"status":"Normal","health":89},
    {"id":"AWS-013","station_code":"AWS-013","location":"Jorhat","district":"Assam","latitude":26.7509,"longitude":94.2037,"status":"Normal","health":95},
    {"id":"AWS-014","station_code":"AWS-014","location":"Gangtok","district":"Sikkim","latitude":27.3389,"longitude":88.6065,"status":"Normal","health":97},
    {"id":"AWS-015","station_code":"AWS-015","location":"Tawang","district":"Arunachal Pradesh","latitude":27.586,"longitude":91.86,"status":"Normal","health":88},
    {"id":"AWS-016","station_code":"AWS-016","location":"Nagaon","district":"Assam","latitude":26.35,"longitude":92.68,"status":"Normal","health":93},
]
class Scenario(str, Enum):
    normal="normal"; spike="spike"; stuck="stuck"; drift="drift"; offset="offset"; unknown="unknown"; weather="weather"
class ScenarioRequest(BaseModel):
    scenario: Scenario = Scenario.spike
    tick: int = 5
def readings_for(scenario: Scenario, tick: int = 5) -> list[dict[str, Any]]:
    output=[]
    for index, station in enumerate(STATIONS):
        temperature, pressure, humidity = (32.4+index*.05, 1007-index*.2, 71-index*.2)
        temperature += math.sin(tick/3)*.3
        if scenario == Scenario.spike and index == 2: temperature,pressure,humidity=42.1,1006.3,70.8
        elif scenario == Scenario.weather: temperature,pressure,humidity=38.4+index*.16,1003-index*.2,63-index*.2
        elif scenario == Scenario.unknown and index == 2: temperature,pressure,humidity=37.2,1002.5,58
        score=.08 if scenario==Scenario.normal else (.45 if scenario==Scenario.weather else (.93 if index==2 else .12))
        output.append({**station,"timestamp":datetime.now(timezone.utc).isoformat(),"temperature":round(temperature,2),"pressure":round(pressure,1),"humidity":round(humidity,1),"anomaly_score":score,"scenario":scenario.value})
    return output
@app.get("/health")
def health(): return {"status":"ok","mode":"prototype","data_source":"simulated AWS"}
@app.get("/stations")
def stations(): return readings_for(Scenario.normal)
@app.get("/stations/{station_id}")
def station(station_id: str): return next(item for item in stations() if item["id"]==station_id)
@app.get("/stations/{station_id}/readings")
def station_readings(station_id: str, hours: int=24): return {"station_id":station_id,"hours":hours,"data":[station(station_id)]}
@app.get("/stations/{station_id}/health")
def station_health(station_id: str):
    item=station(station_id); return {"station_id":station_id,"current_score":item["health"],"trend":"stable","history":[98,97,96,96,95,item["health"]]}
@app.get("/stations/{station_id}/nearby")
def nearby(station_id: str): return [item for item in stations() if item["id"]!=station_id]
@app.get("/anomalies")
def anomalies():
    reading=readings_for(Scenario.spike)[2]; return [{"id":"AN-1024","station_id":"AWS-003","timestamp":reading["timestamp"],"anomaly_score":reading["anomaly_score"],"anomaly_type":"possible_sensor_fault","severity":"HIGH","explanation":"Temperature deviation and spatial inconsistency are dominant signals."}]
@app.get("/alerts")
def alerts(): return [{"id":"SG-1024","station_id":"AWS-003","timestamp":datetime.now(timezone.utc).isoformat(),"severity":"HIGH","type":"Unknown Anomaly","reason":"Current temperature deviates from historical and spatial behaviour.","recommended_action":"Inspect sensor and validate against nearby stations.","status":"OPEN"}]
@app.post("/simulation/scenario")
def simulation(request: ScenarioRequest): return {"scenario":request.scenario.value,"generated_at":datetime.now(timezone.utc).isoformat(),"readings":readings_for(request.scenario,request.tick)}
@app.post("/anomaly/analyze")
def analyze(request: ScenarioRequest):
    regional=request.scenario==Scenario.weather; unknown=request.scenario==Scenario.unknown
    return {"classification":"weather_event" if regional else "unknown_emerging_pattern" if unknown else "possible_sensor_fault","physics_score":82 if regional else 48 if unknown else 57,"spatial_score":91 if regional else 18,"prototype_inference":True,"explanation":"Spatial consistency indicates a likely genuine regional weather event." if regional else "Only AWS-003 deviates significantly while nearby stations remain normal."}
@app.get("/explainability/{anomaly_id}")
def explainability(anomaly_id: str): return {"anomaly_id":anomaly_id,"prototype_visualization":True,"features":[{"name":"Temperature deviation","contribution":.42},{"name":"Spatial deviation","contribution":.31},{"name":"Historical drift","contribution":.18},{"name":"Humidity inconsistency","contribution":.09}]}
