// TIMMY AgentPass escrow rung 1 (V-03, v0.7.8) — a verifiable cryptographic
// payload packaging a parent/child receipt chain, visual QA scores (Roboflow
// lane), and .agentrun bundle hashes under a SHA-256 Merkle root. The pass
// itself is sealed into the runs chain as a verify receipt; verification
// recomputes the root and checks chain membership. Escrow settlement (refund
// on cancel) remains V-03's target-grade scope.
package agentpasscue

#QaScore: {
	model:  string & != ""
	metric: string & != ""
	value:  number & >= 0 & <= 1
}

#Leaf: {
	hash:   string & =~ "^[0-9a-f]{64}$"
	kind:   "receipt" | "bundle"
	label?: string
}

#BundleRef: {
	id:     string & != ""
	sha256: string & =~ "^[0-9a-f]{64}$"
}

#Pass: {
	schema_version: "agent-pass/0.1"
	pass_id:        string & != ""
	created_at:     string & != ""
	parent_receipt: string & =~ "^sha256_[0-9a-f]{64}$"
	children: [...(string & =~ "^sha256_[0-9a-f]{64}$")]
	qa_scores: [...#QaScore]
	bundles:   [...#BundleRef]
	leaves:    [...#Leaf]
	merkle_root: string & =~ "^[0-9a-f]{64}$"
}
