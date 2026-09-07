# Vault Custody × Timmy · build ledger · state

| capsule | frame | state | evidence | acceptance lines |
|---|---|---|---|---|
| p1.capsule | f1 | done | 4/4 | ✓ vitest: AN12196 sun1/sun2/sun3/plain vectors pass, corrupted CMAC rejected<br>✓ GET /t?e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337086 → 302 to /r/<serial><br>✓ six routes render: /r sealed, /r opened, /c, /relic, /m, /log<br>✓ receipt chain verify ok after the build |
| p2.capsule | f2 | done | 2/2 (+2 unreceipted) | – health reports code_mode:true<br>✓ a task that lists tools, verifies a tap, and reads a chain runs as one script<br>✓ receipt carries script_sha256 + output_sha256 + tool call list<br>– unauthorized POST /code → 401 |
| p3.capsule | f3 | done | 4/4 | ✓ bob.jar + engine hashes in env_lock<br>✓ .riv sha256 bound in the build receipt<br>✓ HTML5 bundle opens from /t redirect on a phone<br>✓ companion renders the chain for VC0007 |
| p4.capsule | f4 | done | 2/2 | ✓ one Defold lane screenshot → detect → annotations on the board<br>✓ receipt evidence lists the detection result hash |
| p5.capsule | f5 | done | 3/3 | ✓ two browsers share one board through the Durable Object<br>✓ 3D view shows frames as rooms and capsules as pods<br>✓ pod state follows receipt lifecycle |
| p6.capsule | f6 | next | 0/1 (+2 unreceipted) | – fleet entry 'local-judges' with detect probes<br>✗ fusion receipt carries judge_tier<br>– no behavior change when no local judge is reachable |

| frame | state | orders |
|---|---|---|
| 1 · Vault Custody tap-to-verify | done · attested | 0/5 |
| 2 · Code Mode on the worker | done · attested | 0/1 |
| 3 · Receipted Defold lane + Custody Companion | done | 2/2 |
| 4 · Observer evidence (Roboflow) | done | 2/2 |
| 5 · Slate 3D | done | 2/2 |
| 6 · Sparks judge mesh (fleet rank) | next | 0/0 |

computed 2026-09-07T07:06:40.486Z from 966 root receipts · edge head 2026-09-06 11a3badebe07
