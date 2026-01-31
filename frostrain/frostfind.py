import os
import json

FOLDER_PATH = "C:/Users/hotpi/Downloads/artifacts" 

matched_files = []

for filename in os.listdir(FOLDER_PATH):
    if not filename.endswith(".json"):
        continue

    file_path = os.path.join(FOLDER_PATH, filename) 

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if data.get("_dontDecreaseRandomItemCount") == 1:
            matched_files.append(filename)

    except Exception as e:
        print(f"읽기 실패: {filename} ({e})")

print("조건 만족 파일:")
for name in matched_files:
    print("-", name)
