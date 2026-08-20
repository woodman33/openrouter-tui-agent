// TIMMY neural-mesh ingestion (V-02 rung 2, v0.7.8) — typed hero-asset
// record. Ingestion is local-first: the asset file must exist on disk and
// is content-hashed at ingest; generation via partner routes stays
// target-grade (default-deny spend). The stage reference carries the hash
// so handoffs verify like every other artifact.
package meshcue

#Asset: {
	id:         string & != ""
	source:     "tripo" | "neural" | "scan"
	path:       string & != ""
	format:     "glb" | "usd" | "usda"
	sha256:     string & =~ "^[0-9a-f]{64}$"
	size_bytes: int & > 0
	prim_path:  string & =~ "^/"
}
