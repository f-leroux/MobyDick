import json
from pathlib import Path

# Folder containing the JSON files (adjust if needed)
folder = Path(".")

# Output file
output_file = folder / "Moby.json"

# Read and concatenate JSON files
data = []
for i in range(1, 137):  # 001 to 136 inclusive
    filename = folder / f"Moby{i:03}.json"
    with open(filename, "r", encoding="utf-8") as f:
        data.append(json.load(f))

# Write combined list to Moby.json
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Combined {len(data)} files into {output_file}")
