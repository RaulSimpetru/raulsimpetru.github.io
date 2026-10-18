# Evaluates LimbKit's realistic hand (GN-limbKit on "handRealistic") once per pose in a job file and
# writes every pose's vertex positions plus the shared topology. Run by mesh.mjs:
#   Blender -b limbKit_01.blend --python limb.py -- job.json out_dir
import bpy, sys, json
import numpy as np

job_path, out_dir = sys.argv[sys.argv.index("--") + 1 :][:2]
job = json.load(open(job_path))
hand = bpy.data.objects["handRealistic"]
gn = hand.modifiers["GN-limbKit"]
hand.modifiers["Subdivision"].levels = job["levels"]
# Finger shape: LimbKit blends its master digit toward preset shapes (GN-blend.* on digitMaster).
for mod in bpy.data.objects["digitMaster"].modifiers:
    factor = next(it.identifier for it in mod.node_group.interface.items_tree if getattr(it, "item_type", "") == "SOCKET" and it.name == "Factor")
    mod[factor] = job.get("blends", {}).get(mod.name, 0.0)

# Socket identifiers by (digit, input name): the per-digit inputs repeat their names.
ids, digit = {}, None
for item in gn.node_group.interface.items_tree:
    if getattr(item, "item_type", "") != "SOCKET" or item.in_out != "INPUT":
        continue
    if item.name[:2] in ("1.", "2.", "3.", "4.", "5."):
        digit = item.name.split(" ")[1].lower()
    ids[(digit, item.name)] = item.identifier
ROT0 = tuple(gn[ids[("thumb", "Rotation")]])


def evaluate():
    hand.update_tag()
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    mesh = hand.evaluated_get(graph).to_mesh()
    return mesh


poses = []
topology = None
for pose in job["poses"]:
    for name, inputs in pose.items():
        for key, value in inputs.items():
            if key == "Rotation":
                value = tuple(r + d for r, d in zip(ROT0, value))
            gn[ids[(name, key)]] = value
    mesh = evaluate()
    co = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", co)
    poses.append(co)
    if topology is None:
        mesh.calc_loop_triangles()
        tris = np.empty(len(mesh.loop_triangles) * 3, dtype=np.int32)
        mesh.loop_triangles.foreach_get("vertices", tris)
        attr = {}
        for name in ("cavity", "col_nails"):
            values = np.empty(len(mesh.vertices), dtype=np.float32)
            mesh.attributes[name].data.foreach_get("value", values)
            attr[name] = [round(float(v), 3) for v in values]
        # The wrist opening: the boundary loop with the largest mean y (fingers point to -y).
        count = {}
        for poly in mesh.polygons:
            for key in poly.edge_keys:
                count[key] = count.get(key, 0) + 1
        links = {}
        for (a, b), n in count.items():
            if n == 1:
                links.setdefault(a, []).append(b)
                links.setdefault(b, []).append(a)
        loops, seen = [], set()
        for start in links:
            if start in seen:
                continue
            loop, prev, cur = [start], None, start
            seen.add(start)
            while True:
                nxt = [v for v in links[cur] if v != prev and v not in seen]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
                seen.add(cur)
                loop.append(cur)
            loops.append(loop)
        cv = co.reshape(-1, 3)
        wrist = max(loops, key=lambda loop: float(cv[loop, 1].mean()))
        topology = {"verts": len(mesh.vertices), "tris": tris.tolist(), "cavity": attr["cavity"], "nails": attr["col_nails"], "wrist": wrist, "loops": len(loops)}
    hand.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()

np.stack(poses).astype("<f4").tofile(f"{out_dir}/limb.bin")
topology["poses"] = len(poses)
topology["job"] = job
json.dump(topology, open(f"{out_dir}/limb.json", "w"))
print("limb export", topology["verts"], "verts", len(topology["tris"]) // 3, "tris", len(poses), "poses", topology["loops"], "boundary loops, wrist", len(topology["wrist"]))
