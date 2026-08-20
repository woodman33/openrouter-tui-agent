// TIMMY escrow settlement (V-03 rung 2, v0.7.9) — spend authority as a
// state machine: plans deposit a signed ceiling; draws accrue per receipt;
// settlement refunds ceiling minus draws. Payout authorization (settled)
// gates strictly on a verified AgentPass Merkle proof and a Roboflow QA
// threshold at judge time. Invalid transitions fail closed.
package escrowcue

#State: "armed" | "locked" | "judged" | "settled" | "slashed"

#Transition: {
	from:   #State
	to:     #State
	at:     string & != ""
	reason?: string
}

#Escrow: {
	schema_version: "escrow/0.1"
	escrow_id:    string & != ""
	plan_hash:    string & != ""
	ceiling_usd:  number & >= 0
	drawn_usd:    number & >= 0
	state:        #State
	qa_threshold: number & >= 0 & <= 1
	qa_value?:    number & >= 0 & <= 1
	merkle_root?:  string & =~ "^[0-9a-f]{64}$"
	pass_receipt?: string & =~ "^sha256_[0-9a-f]{64}$"
	refund_usd?:  number & >= 0
	transitions: [...#Transition]
}
