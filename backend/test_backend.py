import requests

def test_health():
    print("Testing /health ...", end=" ")
    r = requests.get("http://127.0.0.1:8000/health")
    if r.status_code == 200 and r.json() == {"status": "ok"}:
        print("OK")
    else:
        print(f"FAILED: {r.status_code} - {r.text}")


def test_conversation():
    print("Testing /conversation ...")
    payload = {
        "scenario": "restaurant",
        "user_text": "me want chicken",
        "history": [
            {"role": "assistant", "content": "Welcome to our restaurant! What can I get for you today?"}
        ]
    }
    r = requests.post("http://127.0.0.1:8000/conversation", json=payload)
    if r.status_code == 200:
        print("Response OK:")
        print(r.json())
    else:
        print(f"FAILED: {r.status_code} - {r.text}")

def test_speak():
    print("Testing /speak ...")
    payload = {
        "text": "This is a test speech synthesis command."
    }
    r = requests.post("http://127.0.0.1:8000/speak", json=payload, stream=True)
    if r.status_code == 200:
        content_type = r.headers.get("content-type")
        if content_type == "audio/mpeg":
            print(f"OK. Stream received. Content type: {content_type}")
        else:
            print(f"FAILED. Expected audio/mpeg, got {content_type}")
    else:
        print(f"FAILED: {r.status_code} - {r.text}")

if __name__ == "__main__":
    test_health()
    print("-" * 20)
    test_conversation()
    print("-" * 20)
    test_speak()
