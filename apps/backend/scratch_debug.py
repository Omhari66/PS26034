import asyncio
from fastapi.testclient import TestClient
from app.main import app
from packages.shared_schema import EvidenceState

client = TestClient(app)
coverage = {'front': True, 'back': True, 'close_up': False}
evidences = [
    {'field_name': 'mrp', 'state': 'FOUND', 'value': '149.00', 'source_image': 'front.jpg', 'bbox': [10, 20, 200, 80], 'ocr_engine': 'paddleocr', 'ocr_confidence': 0.94},
    {'field_name': 'net_quantity', 'state': 'FOUND', 'value': '500g', 'ocr_confidence': 0.91},
    {'field_name': 'manufacturing_date', 'state': 'FOUND', 'value': '2025-01-01', 'ocr_engine': 'paddleocr', 'ocr_confidence': 0.87},
    {'field_name': 'manufacturer_name', 'state': 'FOUND', 'value': '[{"role": "manufactured by", "name": "Acme Corp"}]', 'ocr_engine': 'paddleocr', 'ocr_confidence': 0.88},
    {'field_name': 'consumer_care', 'state': 'FOUND', 'value': '1800-000-000', 'ocr_engine': 'paddleocr', 'ocr_confidence': 0.85}
]

r = client.post('/api/v1/inspections', json={'inspector_id': 'inspector_001'})
insp_id = r.json()['inspection_id']
client.post(f'/api/v1/inspections/{insp_id}/category', json={'category': 'packaged_food'})
r = client.post(f'/api/v1/inspections/{insp_id}/submit', json={'coverage': coverage, 'field_evidences': evidences})
print("Result Status:", r.status_code)
if r.status_code == 200:
    for fr in r.json()['field_results']:
        if fr['field_name'] == 'mrp':
            print("MRP Evidence:", fr['evidence'])
else:
    print(r.text)
