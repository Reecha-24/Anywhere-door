import os
import requests

def test_api():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    print("Testing AWS Health Check...")
    r = requests.get(f"{base_url}/health")
    print(f"Health Response: {r.status_code}, {r.json()}")
    
    print("\nCreating Share Room in AWS DynamoDB...")
    payload = {
        "text_content": "Anywhere Door AWS DynamoDB & S3 Test Snippet.",
        "expires_in_minutes": 60,
        "max_downloads": -1
    }
    r = requests.post(f"{base_url}/shares", json=payload)
    print(f"Create Share Status: {r.status_code}")
    share = r.json()
    code = share['code']
    print(f"Created Share Code: {code}")
    
    print("\nRetrieving Share Room by PIN Code from DynamoDB...")
    r = requests.get(f"{base_url}/shares/{code}")
    print(f"Get Share Status: {r.status_code}")
    print(f"Retrieved text_content: {r.json().get('text_content')}")
    
    # Test uploading a file to Amazon S3
    test_file_path = "aws_test_file.txt"
    with open(test_file_path, "w") as f:
        f.write("Anywhere Door AWS S3 File Upload Test Content.")
        
    print("\nUploading File to Amazon S3 via Share Room...")
    with open(test_file_path, "rb") as f:
        r = requests.post(f"{base_url}/files/upload/{code}", files={"files": ("aws_test_file.txt", f, "text/plain")})
    print(f"Upload Status: {r.status_code}, Response: {r.json()}")
    
    # Download file back
    file_id = r.json()["uploaded_files"][0]["file_id"]
    print(f"\nDownloading File from Amazon S3 (file_id: {file_id})...")
    dl_resp = requests.get(f"{base_url}/files/download/{code}/{file_id}")
    print(f"Download Status: {dl_resp.status_code}, Downloaded Content: {dl_resp.text}")
    
    # Clean up test file
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
        
    print("\nALL AWS DYNAMODB & AMAZON S3 API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
