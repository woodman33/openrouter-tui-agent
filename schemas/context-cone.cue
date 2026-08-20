// TIMMY Context Cone (V-01 rung 1, v0.7.5) — 3-tier context indexing with
// strict token budgeting. L0 apex manifest (always inlined), L1 structural
// skeleton, L2 deep diffs/traces (selected under budget, recency-ordered).
// CUE validates structure; selection policy lives in context-cone.ts.
package conecue

#Kind: "manifest" | "skeleton" | "trace" | "diff" | "receipt" | "doc"
#Tier: "L0" | "L1" | "L2"

#Entry: {
	id:      string & != ""
	tier:    #Tier
	kind:    #Kind
	summary: string & != ""
	tokens:  int & > 0
	path?:   string
	sha256?: string
	recency?: int & >= 0
}

#Cone: {
	schema_version: "cone/0.1"
	budget_tokens:  int & > 0
	tiers: {
		L0: [...(#Entry & {tier: "L0"})]
		L1: [...(#Entry & {tier: "L1"})]
		L2: [...(#Entry & {tier: "L2"})]
	}
}
