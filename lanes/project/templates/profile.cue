// TIMMY project profile — project-folder/v0 (mindship-v5c2 step 5).
// One file per project at ~/timmy/projects/<name>/profile.cue. Read by
// `timmy project menu` and by every harness menu (fleet/harness-menu.mjs).
// `cue vet profile.cue` checks it when cue is installed; the reader tolerates
// the plain key: "value" subset when it is not.
package project

#Profile: {
	name:     string & =~"^[a-z0-9][a-z0-9._-]{0,39}$"
	owner:    string
	created:  string // ISO-8601
	standard: "project-folder/v0"
	harnesses: {
		allowed:   [...string]
		preferred: string | *""
	}
	budget: {
		max_spend_usd: number & >=0 | *2
	}
	models: {
		mind:   string | *"google/gemini-3.7-flash"
		actors: [...string] | *[]
	}
	receipts: {
		// the root receipt store (the committed .timmy/store-pin); never a subdirectory
		store: string
	}
	paths: {
		skills: "skills"
		plans:  "plans"
		boards: "boards"
		drop:   "drop"
		out:    "out"
	}
	tags: [...string] | *[]
}

profile: #Profile & {
	name:     "__NAME__"
	owner:    "__OWNER__"
	created:  "__CREATED__"
	standard: "project-folder/v0"
	harnesses: {
		allowed:   [__ALLOWED__]
		preferred: "__PREFERRED__"
	}
	budget: {
		max_spend_usd: __BUDGET__
	}
	receipts: {
		store: "__STORE__"
	}
	tags: [__TAGS__]
}
