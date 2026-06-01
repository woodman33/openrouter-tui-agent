# Commercial Wedge: Trust the Receipt, Not the Model

TIMMY is not an OpenRouter-only terminal UI. OpenRouter is one supported provider inside a broader Agent Trust OS for governed AI agent execution, provider routing, verified context packs, run receipts, companion telemetry, and local-first audit trails, with Cloudflare-hosted audit trails as the edge deployment path.

Enterprise buyers are not paying for another AI terminal. They pay for proof that agents behaved: governed execution, verified context, AgentPass entitlements, policy-aware scopes, and tamper-evident receipts that can be audited after the run.

OpenRouter, OpenAI, OpenHands, Claude Code, Pi, and future runners are governed through the same pattern when registered: scopes, risk classes, context entitlements, and receipts. The provider or runner can change; the trust contract remains stable.

| Feature | AgentPass Scope | Risk Class | Receipt Field | Paid Tier |
| --- | --- | --- | --- | --- |
| Local governed run | `run.local` | `model_execution` | `run_id`, `validation_status` | Free |
| OpenRouter model execution | `model.openrouter.execute` | `model_execution` | `selected_model`, `budget_zone` | Free |
| OpenHands runner | `agent.run.openhands` | `workspace_mutation`, `model_execution`, `network_call` | `runner_id`, `command_hash`, `files_changed` | Builder |
| Verified context pack: OpenRouter SDK | `context.read.openrouter_agent_sdk` | `context_injection` | `context_pack_id`, `context_source_hash` | Free |
| Verified context pack: Canva Apps SDK | `context.read.canva_apps_sdk` | `context_injection` | `context_pack_id`, `context_source_hash` | Pro |
| Hosted receipt page | `receipt.hosted.read` | `external_publish` | `hosted_receipt_url`, `manifest_hash` | Builder |
| Team receipt history | `receipt.team.read` | `read_only` | `team_id`, `receipt_index_hash` | Team |
| Private context registry | `context.registry.private` | `context_injection`, `secret_access` | `registry_entry_hash`, `passport_jti_hash` | Team |
| Custom enterprise policy | `policy.enterprise.custom` | `deployment`, `secret_access` | `policy_hash`, `denied_action_count` | Enterprise |

## Why This Is the Wedge

The wedge is proof, not interface polish. TIMMY makes agent behavior reviewable by binding each meaningful action to a scope, a risk class, a context source, and a receipt field. That gives buyers a concrete artifact they can inspect, share, and govern.

## Pricing Logic

Free usage proves the local loop. Builder adds hosted proof. Pro adds verified context packs and richer runner scopes. Team adds shared history and private registries. Enterprise adds custom AgentPass policy and Cloudflare deployment control.

## Scope-to-Receipt Mapping

Every paid feature should map to an AgentPass scope and a receipt field. If a feature cannot produce audit evidence, it should not be sold as governance.

## What Stays Free

Local governed runs, local receipts, core docs, and baseline OpenRouter execution stay free because they create the trust loop and make TIMMY understandable without a sales call.

## What Becomes Paid

Hosted receipt pages, private receipt history, verified context packs beyond the core set, runner-specific scopes, private context registries, and custom policy enforcement become paid because they turn local proof into organizational governance.

## Future Marketplace Path

GitBook becomes the public governance map for the product. Every release page can link to a sample `.agentrun` schema, every provider page can list required scopes, every runner page can list risk class and approval behavior, and every paid feature can map to an AgentPass entitlement.
