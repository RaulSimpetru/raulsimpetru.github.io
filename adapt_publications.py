from pathlib import Path

for path in Path("content/publication").rglob("index.md"):
	with path.open("r") as f:
		lines = f.readlines()

		for line_index in range(len(lines)):
			if "Raul" in lines[line_index] or "Simpetru" in lines[line_index]:
				lines[line_index] = "- admin\n"

	with path.open("w") as f:
		f.writelines(lines)
