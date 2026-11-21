# Soroban Events Integration Guide

## Overview

The BankerChanger smart contracts now emit comprehensive Soroban events for all critical state transitions. This enables real-time updates, off-chain indexing, and frontend consumption of contract state changes.

## What Changed

### New Events Added

The following events have been added to the **MarketFactory** contract and are now emitted on all state-modifying operations:

1. **factory_paused** - Admin pauses market creation
2. **factory_unpaused** - Admin unpauses market creation  
3. **market_wasm_updated** - Market WASM hash is updated
4. **oracle_added** - New oracle whitelisted
5. **oracle_removed** - Oracle removed from whitelist
6. **default_config_updated** - Default market configuration changed

### Enhanced Events

Existing events that were already in place:
- **market_created** - Emitted when new market deployed
- **admin_proposed** - Emitted when admin transfer proposed
- **admin_transferred** - Emitted when admin transfer accepted

## Event Schema

For detailed event definitions, schemas, and payload examples, see **EVENT_SCHEMA.md** in the contracts directory.

## Integration Checklist

### For Indexers

- [ ] Subscribe to all factory topics:
  - `factory_paused`
  - `factory_unpaused`
  - `market_created`
  - `market_wasm_updated`
  - `oracle_added`
  - `oracle_removed`
  - `default_config_updated`
  - `admin_proposed`
  - `admin_transferred`

- [ ] Subscribe to all market topics:
  - `bet_placed`
  - `market_locked`
  - `oracle_report_received`
  - `consensus_reached`
  - `market_resolved`
  - `market_cancelled`
  - `winnings_claimed`
  - `refund_claimed`
  - `odds_updated`
  - `pool_initialized`
  - `slippage_checked`
  - `odds_computed`
  - `liquidity_added`
  - `liquidity_removed`
  - `market_disputed`
  - `dispute_resolved`

### For Frontends

**Real-Time Odds Updates:**
```
Subscribe to: odds_updated
Refresh: Live odds display after each bet
Frequency: High (every bet)
```

**Market Status Updates:**
```
Subscribe to: market_created, market_locked, market_resolved, market_cancelled
Refresh: Market list, individual market views
Frequency: Low (state changes only)
```

**Bet Confirmation:**
```
Subscribe to: bet_placed
Wait for: User's bet appears in event feed
Confirmation: Use as source of truth
```

**Settlement Flow:**
```
Subscribe to: consensus_reached, market_resolved
Show: Resolution countdown, settlement status
Resolution: Show payout/refund eligibility
```

### For Backend/Treasury Tracking

- [ ] Subscribe to treasury topics:
  - `fee_deposited`
  - `fee_withdrawn`
  - `emergency_drain`
  - `audit_recorded`
  - `daily_cap_reached`
  - `withdrawal_limit_updated`

- [ ] Maintain audit trail from:
  - `admin_transferred` (admin changes)
  - `fee_withdrawn` (fund movements)
  - `emergency_drain` (extraordinary actions)

## Code Examples

### Event Subscription (JavaScript)

```javascript
// Subscribe to factory pause events
client.on('factory_paused', (event) => {
  const { admin } = event.data;
  console.log(`Factory paused by ${admin}`);
  // Update UI: disable market creation button
});

client.on('factory_unpaused', (event) => {
  const { admin } = event.data;
  console.log(`Factory unpaused by ${admin}`);
  // Update UI: enable market creation button
});

// Subscribe to oracle management
client.on('oracle_added', (event) => {
  const { admin, oracle_address } = event.data;
  console.log(`Oracle ${oracle_address} added by ${admin}`);
  // Update oracle registry display
});

// Subscribe to live odds updates
client.on('odds_updated', (event) => {
  const { market_id, pool_a, pool_b, pool_draw, impact_bps } = event.data;
  updateOddsDisplay(market_id, { pool_a, pool_b, pool_draw });
  showImpactIndicator(impact_bps);
});
```

### Event Parsing (Rust)

```rust
// The shared crate provides event parsers
use boxmeout_shared::event_parser::*;

// Parse a factory_paused event
if let Ok(parsed) = parse_factory_paused_event(&env, &event) {
    println!("Factory paused by: {}", parsed.admin);
}

// Parse a market_created event
if let Ok(parsed) = parse_market_created_event(&env, &event) {
    println!("Market {} created: {}", parsed.market_id, parsed.market_address);
}

// Parse odds updates for real-time display
if let Ok(parsed) = parse_odds_updated_event(&env, &event) {
    println!("Odds changed: Pool A = {}", parsed.pool_a);
}
```

## Testing

### Running Event Emission Tests

```bash
cd contracts
cargo test event_emission_tests -- --nocapture
```

### Test Coverage

The following tests verify event emission:

**Factory Tests:**
- `test_pause_factory_emits_event` ✓
- `test_unpause_factory_emits_event` ✓
- `test_update_default_config_emits_event` ✓
- `test_add_oracle_emits_event` ✓
- `test_remove_oracle_emits_event` ✓
- `test_update_market_wasm_emits_event` ✓
- `test_propose_admin_emits_event` ✓
- `test_accept_admin_emits_event` ✓
- `test_create_market_emits_event` ✓

**Event Schema Tests (shared):**
- `test_emit_factory_paused` ✓
- `test_emit_factory_unpaused` ✓
- `test_emit_default_config_updated` ✓
- `test_emit_oracle_added` ✓
- `test_emit_oracle_removed` ✓
- `test_emit_market_wasm_updated` ✓

## Backwards Compatibility

✅ **No Breaking Changes**

- All existing functions remain unchanged
- Events are additive (new functionality)
- Existing market and bettor functionality unaffected
- Already-deployed markets continue working

## Documentation

- **EVENT_SCHEMA.md** - Comprehensive event definitions with payload examples
- **Rustdoc** - In-code documentation for all event functions
- **Integration tests** - Working examples of event verification

## Verification Checklist

- [x] Factory pause/unpause emit events
- [x] Oracle management operations emit events
- [x] Config updates emit events
- [x] WASM updates emit events
- [x] Admin transfers emit events
- [x] Market creation emits events
- [x] Events documented with payload schemas
- [x] Event emission tests added
- [x] Backwards compatible (no breaking changes)
- [x] All state-modifying functions emit events

## Common Issues & Troubleshooting

### Events Not Appearing

**Issue**: Subscribed to events but not receiving them.

**Solutions**:
1. Verify Soroban RPC endpoint supports event subscriptions
2. Check that contract address and event topics are correct
3. Ensure ledger has advanced (events finalize after ledger close)
4. Verify reconnection logic if using WebSocket subscriptions

### Duplicate Events

**Issue**: Receiving the same event multiple times.

**Solutions**:
1. Multiple subscriptions to same topic (deduplicate by (ledger, tx_index, event_index))
2. Ledger reorg handling (track ledger sequence, discard if reorg detected)
3. Resume from checkpoint on reconnect (track last processed ledger)

### Event Payload Mismatch

**Issue**: Event data format differs from expected schema.

**Solutions**:
1. Verify contract version matches documentation
2. Check event parsing library version
3. Enable debug logging to see raw event topics/data
4. Compare against EVENT_SCHEMA.md for correct format

## Next Steps

1. **Index Events**: Deploy event indexer to subscribe and store events
2. **Frontend Integration**: Implement event listeners in web/mobile UI
3. **Backend Analytics**: Process events for reporting and audit trails
4. **Monitoring**: Set up alerts for critical events (pause, admin transfer)
5. **Documentation**: Create user-facing docs for event-driven features

## Support

For questions or issues:
- Review EVENT_SCHEMA.md for event definitions
- Check test implementations in market_factory/src/lib.rs
- Verify event emission with integration tests
- Consult Soroban documentation on event subscriptions
