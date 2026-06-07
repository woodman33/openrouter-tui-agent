# TIMMY Basic Demo Example

This example demonstrates how to run a local demo and inspect the generated verification receipt.

## Prerequisite

Make sure you have Node.js 18+ installed.

## Steps

1. **Initialize the Demo**:
   Execute the demo command to initialize directories and generate a local receipt:
   ```bash
   npx timmy-tui demo
   ```

2. **Verify CLI Outputs**:
   The terminal will output the validation success:
   ```
   TIMMY AgentOps Demo
   ✓ Created .timmy/receipts/demo-receipt.json
   ✓ Generated receipt hash
   ✓ Local proof complete
   ```

3. **Inspect the Receipt**:
   Open and view the receipt file:
   ```bash
   cat .timmy/receipts/demo-receipt.json
   ```

   Notice how the schema fields (such as `run_id`, `created_at`, `cwd`, and `receipt_sha256`) are populated deterministically.
