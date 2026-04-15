import ssl
import time
import urllib.request
from datetime import datetime

URL = "https://chaicode-cinema.onrender.com/health"
INTERVAL = 14 * 60  # 14 minutes


def ping():
    try:
        ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(URL, timeout=10, context=ctx) as res:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] OK {res.status}")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] FAILED: {e}")


print(f"Pinging {URL} every 14 minutes. Press Ctrl+C to stop.")
while True:
    ping()
    time.sleep(INTERVAL)
