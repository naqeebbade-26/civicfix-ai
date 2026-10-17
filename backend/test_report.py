
import json
from urllib.request import Request, urlopen

url = "http://127.0.0.1:5000/api/reports"

report = {
    "category": "Roads & Potholes",
    "location": "Pune, Test Road",
    "description": "Test report to verify SQLite saving."
}

request = Request(
    url,
    data=json.dumps(report).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urlopen(request) as response:
    print("HTTP status:", response.status)
    print(response.read().decode("utf-8"))
