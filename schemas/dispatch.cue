// TIMMY Command Post v0.1 — DispatchPlan structure (CUE validates; NO Nickel
// at v0.1 per owner amendment). Approval binds the complete immutable plan
// hash; any mutation invalidates approval.
package dispatch

#Plan: {
	schema_version: "dispatch/0.1"
	objective:      string & != ""
	deliverables: [...string]
	acceptance_tests: [...string]
	harnesses: [...string]
	model_policy: {
		requested:     string
		allow_paid:    bool
		max_spend_usd: number & >= 0
	}
	copies: int & >= 1 & <= 8
	cadence: {
		mode:       "parallel" | "sequential"
		depends_on: [...string]
	}
	context_manifest: [...{
		path:   string
		sha256: string
	}]
	repo_ref: string
	workspace: {
		kind:  "docker" | "host-ephemeral"
		image?: string
		path?:  string
	}
	permissions: {
		filesystem: "ro" | "rw-ephemeral"
		network:    bool
		tools: [...string]
		secrets: [...string]
	}
	limits: {
		tokens?:  int & > 0
		cost_usd: number & >= 0
		steps?:   int & > 0
		wall_ms:  int & > 0
	}
	retry_limit: int & >= 0 & <= 3
	approval: {
		required: bool
		mode:     "manual" | "delegated-envelope"
	}
	expected_artifacts: [...string]
	telemetry: {
		redact: bool
		events: bool
	}
}
