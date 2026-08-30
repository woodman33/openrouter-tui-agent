// FORGE reference-sheet schema (p13; decisions.md D3). CUE decides budget,
// aspect, and required-slot validity BEFORE any gen fires. slot_id
// uniqueness is enforced in sheet.ts (CUE has no distinct-list builtin).
package forge

#SlotClass: "terrain" | "material" | "weather" | "hero" | "other"

#Slot: {
	slot_id:       string & =~"^slot-[a-z0-9-]+$"
	class:         #SlotClass
	required:      bool
	prompt:        string
	_plen:         true
	_plen:         len(prompt) >= 4
	provider_pref: string
	aspect?:       string & =~"^[0-9]+:[0-9]+$"
	est_cost_usd?: number & >= 0
}

#Sheet: {
	sheet_id:       string & =~"^sheet-[a-z0-9-]+$"
	budget_cap_usd: number & > 0
	aspect:         string & =~"^[0-9]+:[0-9]+$"
	slots: [...#Slot]

	// budget cap: loader sums the estimates (est_total_usd) because CUE
	// list.Sum comprehensions over open lists bake at definition time (D8)
	est_total_usd: number & >= 0
	_budget_ok: true
	_budget_ok: est_total_usd <= budget_cap_usd

	// required slots: at least one, and a required hero is mandatory.
	// Counts are extracted by the loader (sheet.ts) — CUE if-comprehensions
	// and open-list len() bake at definition time (D8); CUE bounds the
	// counts here and cross-validates the per-slot required flag.
	required_classes:   [...string]
	required_count:     int & >= 1
	hero_required_count: int & >= 1
}

sheet: #Sheet
