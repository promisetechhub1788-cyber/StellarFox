# Event Schema Documentation

This document defines the Soroban events emitted by the BankerChanger smart contracts. Events are essential for real-time updates, off-chain indexing, and frontend consumption.

## Event Emission Standards

All events follow this pattern:
- **Topics**: Used for indexing and filtering (first topic is always the event name as a Symbol)
- **Data**: Event-specific payload containing details

## MarketFactory Events

### factory_paused
Emitted when the factory admin pauses market creation.

```
Topics: (Symbol("factory_paused"),)
Data:   admin: Address

Payload:
{
  "admin": "GXXXXXXXXXXXXXXXXXXXXX"
}
```

**Frontend Use**: Display factory pause status in UI; prevent users from creating new markets.

---

### factory_unpaused
Emitted when the factory admin unpauses market creation.

```
Topics: (Symbol("factory_unpaused"),)
Data:   admin: Address

Payload:
{
  "admin": "GXXXXXXXXXXXXXXXXXXXXX"
}
```

**Frontend Use**: Resume market creation flow; update status indicators.

---

### market_created
Emitted when a new market is deployed for a boxing match.

```
Topics: (Symbol("market_created"), market_id: u64)
Data:   (contract_address: Address, match_id: String)

Payload:
{
  "market_id": 42,
  "contract_address": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "match_id": "FURY-USYK-2025"
}
```

**Frontend Use**: Trigger market list updates; enable betting UI for the new market.

---

### market_wasm_updated
Emitted when the factory updates the market WASM hash used for new deployments.

```
Topics: (Symbol("market_wasm_updated"),)
Data:   (admin: Address, new_wasm_hash: BytesN<32>)

Payload:
{
  "admin": "GXXXXXXXXXXXXXXXXXXXXX",
  "new_wasm_hash": "abc123def456..."
}
```

**Frontend Use**: Audit trail for contract upgrades; versioning system for deployed markets.

---

### oracle_added
Emitted when a new oracle is whitelisted.

```
Topics: (Symbol("oracle_added"),)
Data:   (admin: Address, oracle_address: Address)

Payload:
{
  "admin": "GXXXXXXXXXXXXXXXXXXXXX",
  "oracle_address": "GYYYYYYYYYYYYYYYYYYY"
}
```

**Frontend Use**: Update oracle registry; audit trail for oracle management.

---

### oracle_removed
Emitted when an oracle is removed from the whitelist.

```
Topics: (Symbol("oracle_removed"),)
Data:   (admin: Address, oracle_address: Address)

Payload:
{
  "admin": "GXXXXXXXXXXXXXXXXXXXXX",
  "oracle_address": "GYYYYYYYYYYYYYYYYYYY"
}
```

**Frontend Use**: Update oracle registry; audit trail for oracle deactivation.

---

### default_config_updated
Emitted when the factory default market configuration is updated.

```
Topics: (Symbol("default_config_updated"),)
Data:   (min_bet: i128, max_bet: i128, fee_bps: u32, lock_before_secs: u64, resolution_window: u64)

Payload:
{
  "min_bet": "1000000",
  "max_bet": "100000000000",
  "fee_bps": 200,
  "lock_before_secs": 3600,
  "resolution_window": 86400
}
```

**Frontend Use**: Update validation rules for bet placement; reflect new constraints in UI.

---

### admin_proposed
Emitted when the current admin nominates a successor (two-step transfer).

```
Topics: (Symbol("admin_proposed"),)
Data:   (current_admin: Address, proposed_admin: Address)

Payload:
{
  "current_admin": "GXXXXXXXXXXXXXXXXXXXXX",
  "proposed_admin": "GYYYYYYYYYYYYYYYYYYYYYY"
}
```

**Frontend Use**: Notify new admin of pending acceptance; audit trail for admin transitions.

---

### admin_transferred
Emitted when admin privileges transfer to a new address.

```
Topics: (Symbol("admin_transferred"),)
Data:   (old_admin: Address, new_admin: Address)

Payload:
{
  "old_admin": "GXXXXXXXXXXXXXXXXXXXXX",
  "new_admin": "GYYYYYYYYYYYYYYYYYYYYYY"
}
```

**Frontend Use**: Update admin context; trigger permission UI refresh.

---

## Market Contract Events

### bet_placed
Emitted when a bettor places a bet.

```
Topics: (Symbol("bet_placed"), market_id: u64)
Data:   BetRecord {
  bettor: Address,
  market_id: u64,
  side: BetSide (FighterA | FighterB | Draw),
  amount: i128,  // stroops (seven-decimal scale)
  placed_at: u64,
  claimed: bool
}

Payload:
{
  "market_id": 42,
  "bettor": "GXXXXXXXXXXXXXXXXXXXXX",
  "side": "FighterA",
  "amount": "5000000",
  "placed_at": 1234567890,
  "claimed": false
}
```

**Frontend Use**: Real-time bet feed; update pool sizes and odds; player activity tracking.

---

### market_locked
Emitted when betting is closed for a market (lock time reached).

```
Topics: (Symbol("market_locked"), market_id: u64)
Data:   ()

Payload: {}
```

**Frontend Use**: Disable bet placement UI; show "Locked" status.

---

### oracle_report_received
Emitted when a valid oracle report is stored (part of 2-of-3 consensus).

```
Topics: (Symbol("oracle_report_received"), market_id: u64)
Data:   (oracle_address: Address, outcome_byte: u32, report_count: u32)

Payload:
{
  "market_id": 42,
  "oracle_address": "GXXXXXXXXXXXXXXXXXXXXX",
  "outcome_byte": 0,  // 0=FighterA, 1=FighterB, 2=Draw, 3=NoContest
  "report_count": 1
}
```

**Frontend Use**: Display resolution progress ("1/2 oracles confirmed"); live resolution UI.

---

### consensus_reached
Emitted when 2-of-3 oracle reports agree (market enters ResolutionPending).

```
Topics: (Symbol("consensus_reached"), market_id: u64)
Data:   (tier: u32, matching_reports: u32, outcome_byte: u32)

Payload:
{
  "market_id": 42,
  "tier": 8,
  "matching_reports": 2,
  "outcome_byte": 0
}
```

**Frontend Use**: Begin cooldown timer display; prepare settlement UI.

---

### market_resolution_pending
Emitted when oracle consensus is reached but dispute cooldown is active.

```
Topics: (Symbol("market_resolution_pending"), market_id: u64)
Data:   (outcome_byte: u8, cooldown_end_ledger: u32)

Payload:
{
  "market_id": 42,
  "outcome_byte": 0,
  "cooldown_end_ledger": 518400
}
```

**Frontend Use**: Show cooldown countdown; indicate settlement is pending dispute resolution.

---

### resolution_finalized
Emitted when a market's outcome is finalized after the cooldown window.

```
Topics: (Symbol("resolution_finalized"), market_id: u64)
Data:   outcome_byte: u8

Payload:
{
  "market_id": 42,
  "outcome_byte": 0
}
```

**Frontend Use**: Enable winnings/refund claiming; show final outcome.

---

### market_resolved
Emitted when a final outcome is committed to the blockchain.

```
Topics: (Symbol("market_resolved"), market_id: u64)
Data:   (outcome: Outcome, oracle_address: Address)

Payload:
{
  "market_id": 42,
  "outcome": "FighterA",
  "oracle_address": "GXXXXXXXXXXXXXXXXXXXXX"
}
```

**Frontend Use**: Update market status; mark bets as eligible for claim/refund.

---

### market_cancelled
Emitted when a market is cancelled.

```
Topics: (Symbol("market_cancelled"), market_id: u64)
Data:   reason: String

Payload:
{
  "market_id": 42,
  "reason": "fight_postponed"
}
```

**Frontend Use**: Enable refund claiming; show cancellation reason; update market status.

---

### winnings_claimed
Emitted when a winner claims their payout.

```
Topics: (Symbol("winnings_claimed"), market_id: u64)
Data:   ClaimReceipt {
  bettor: Address,
  market_id: u64,
  amount_won: i128,  // stroops
  fee_deducted: i128,  // stroops
  claimed_at: u64
}

Payload:
{
  "market_id": 42,
  "bettor": "GXXXXXXXXXXXXXXXXXXXXX",
  "amount_won": "9800000",
  "fee_deducted": "200000",
  "claimed_at": 1234567890
}
```

**Frontend Use**: Update user balance; show settlement receipt; transaction history.

---

### refund_claimed
Emitted when a bettor claims a refund on a cancelled market.

```
Topics: (Symbol("refund_claimed"), market_id: u64)
Data:   (bettor: Address, amount: i128)

Payload:
{
  "market_id": 42,
  "bettor": "GXXXXXXXXXXXXXXXXXXXXX",
  "amount": "5000000"
}
```

**Frontend Use**: Update user balance; show refund receipt.

---

### odds_updated
Emitted after each bet that changes pool ratios (live odds feed).

```
Topics: (Symbol("odds_updated"), market_id: u64)
Data:   (tier: u32, pool_a: i128, pool_b: i128, pool_draw: i128, impact_bps: i128)

Payload:
{
  "market_id": 42,
  "tier": 8,
  "pool_a": "50000000",
  "pool_b": "45000000",
  "pool_draw": "5000000",
  "impact_bps": 150
}
```

**Frontend Use**: Real-time odds display; update implied probabilities every bet.

---

### pool_initialized
Emitted when a market's liquidity pools first have funds (all pools > 0).

```
Topics: (Symbol("pool_initialized"), market_id: u64)
Data:   (tier: u32, pool_a: i128, pool_b: i128, pool_draw: i128)

Payload:
{
  "market_id": 42,
  "tier": 8,
  "pool_a": "10000000",
  "pool_b": "10000000",
  "pool_draw": "1000000"
}
```

**Frontend Use**: Activate AMM pricing; begin live odds display.

---

### slippage_checked
Emitted when a bet passes the AMM slippage guard (tier-aware price impact check).

```
Topics: (Symbol("slippage_checked"), market_id: u64)
Data:   (tier: u32, shares_out: i128, impact_bps: i128, max_slippage_bps: i128)

Payload:
{
  "market_id": 42,
  "tier": 8,
  "shares_out": "5000000",
  "impact_bps": 150,
  "max_slippage_bps": 3000
}
```

**Frontend Use**: Audit trail for slippage enforcement; display price impact to users.

---

### odds_computed
Emitted after a bet is placed with computed AMM odds.

```
Topics: (Symbol("odds_computed"), market_id: u64)
Data:   (pool_a: i128, pool_b: i128, pool_draw: i128, shares_out: i128, price_impact_bps: i128)

Payload:
{
  "market_id": 42,
  "pool_a": "50000000",
  "pool_b": "45000000",
  "pool_draw": "5000000",
  "shares_out": "5000000",
  "price_impact_bps": 150
}
```

**Frontend Use**: Display computed odds; show shares received.

---

### liquidity_added
Emitted when an LP provides liquidity to a market pool.

```
Topics: (Symbol("liquidity_added"), market_id: u64)
Data:   (provider: Address, amount_a: i128, amount_b: i128, amount_draw: i128, lp_shares: i128)

Payload:
{
  "market_id": 42,
  "provider": "GXXXXXXXXXXXXXXXXXXXXX",
  "amount_a": "10000000",
  "amount_b": "10000000",
  "amount_draw": "1000000",
  "lp_shares": "5000000"
}
```

**Frontend Use**: Update LP position tracking; show shares received.

---

### liquidity_removed
Emitted when an LP redeems shares from a market pool.

```
Topics: (Symbol("liquidity_removed"), market_id: u64)
Data:   (provider: Address, lp_shares_burned: i128, amount_a: i128, amount_b: i128, amount_draw: i128, fees_claimed: i128)

Payload:
{
  "market_id": 42,
  "provider": "GXXXXXXXXXXXXXXXXXXXXX",
  "lp_shares_burned": "5000000",
  "amount_a": "10000000",
  "amount_b": "10000000",
  "amount_draw": "1000000",
  "fees_claimed": "50000"
}
```

**Frontend Use**: Update LP position tracking; show redemption receipt.

---

### market_disputed
Emitted when a resolved market is placed under review.

```
Topics: (Symbol("market_disputed"), market_id: u64)
Data:   reason: String

Payload:
{
  "market_id": 42,
  "reason": "oracle_conflict"
}
```

**Frontend Use**: Show dispute status; freeze settlements; await resolution.

---

### dispute_resolved
Emitted when an admin finalizes a disputed outcome.

```
Topics: (Symbol("dispute_resolved"), market_id: u64)
Data:   final_outcome: Outcome

Payload:
{
  "market_id": 42,
  "final_outcome": "Draw"
}
```

**Frontend Use**: Update market outcome; enable settlements.

---

## Treasury Contract Events

### fee_deposited
Emitted when a market deposits fees into the treasury.

```
Topics: (Symbol("fee_deposited"),)
Data:   (market: Address, token: Address, amount: i128)

Payload:
{
  "market": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "token": "CYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
  "amount": "200000"
}
```

**Frontend Use**: Treasury balance tracking; revenue analytics.

---

### fee_withdrawn
Emitted when the admin withdraws accumulated fees.

```
Topics: (Symbol("fee_withdrawn"),)
Data:   (token: Address, amount: i128, destination: Address)

Payload:
{
  "token": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "amount": "1000000",
  "destination": "GXXXXXXXXXXXXXXXXXXXXX"
}
```

**Frontend Use**: Treasury audit trail; withdrawal history.

---

### withdrawal_limit_updated
Emitted when the admin updates the daily withdrawal limit.

```
Topics: (Symbol("withdrawal_limit_updated"),)
Data:   (old_limit: i128, new_limit: i128)

Payload:
{
  "old_limit": "500000000",
  "new_limit": "1000000000"
}
```

**Frontend Use**: Display current withdrawal cap; audit trail for limit changes.

---

### daily_cap_reached
Emitted when a withdrawal hits the daily ceiling.

```
Topics: (Symbol("daily_cap_reached"), day_bucket: u64)
Data:   (token: Address, total_withdrawn_today: i128, cap: i128)

Payload:
{
  "day_bucket": 20230101,
  "token": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "total_withdrawn_today": "1000000000",
  "cap": "1000000000"
}
```

**Frontend Use**: Alert users to daily cap; queue withdrawals for next day.

---

### emergency_drain
Emitted when the admin drains all fees for a token.

```
Topics: (Symbol("emergency_drain"),)
Data:   (token: Address, amount: i128, admin: Address)

Payload:
{
  "token": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "amount": "50000000",
  "admin": "GXXXXXXXXXXXXXXXXXXXXX"
}
```

**Frontend Use**: Alert users to emergency action; audit trail for extraordinary withdrawals.

---

### audit_recorded
Emitted whenever an immutable audit entry is appended.

```
Topics: (Symbol("audit_recorded"),)
Data:   AuditEntry {
  seq: u64,
  action: String,
  actor: Address,
  token: Address,
  amount: i128,
  timestamp: u64
}

Payload:
{
  "seq": 42,
  "action": "withdrawal",
  "actor": "GXXXXXXXXXXXXXXXXXXXXX",
  "token": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "amount": "1000000",
  "timestamp": 1234567890
}
```

**Frontend Use**: Immutable audit trail; regulatory compliance; forensic analysis.

---

### config_updated
Emitted when a configuration parameter is changed.

```
Topics: (Symbol("config_updated"),)
Data:   (param_name: String, new_value: i128)

Payload:
{
  "param_name": "daily_cap",
  "new_value": "1000000000"
}
```

**Frontend Use**: Display current configuration; audit trail for setting changes.

---

## Event Indexing Best Practices

### Topic-Based Filtering
Use topics to efficiently filter events:
```
// Index all markets by ID
FILTER: topics[0] == "market_created" AND topics[1] == market_id

// Track admin changes
FILTER: topics[0] == "admin_transferred"

// Monitor oracle activity
FILTER: topics[0] == "oracle_added" OR topics[0] == "oracle_removed"
```

### Data Normalization
All monetary amounts are in stroops (lowest denomination), not XLM:
- 1 XLM = 10,000,000 stroops
- All i128 amounts are stroops

### Event Ordering
Events are emitted in the order of execution within a transaction.
Never assume causality across transactions.

### Reorg Handling
The backend should monitor for ledger reorgs and re-process events from the reorg point.

---

## Integration Checklist

- [ ] Indexer subscribes to all event topics
- [ ] Event payloads are deserialized correctly
- [ ] Monetary amounts are displayed in correct denomination
- [ ] Real-time UI subscribes to odds_updated and slippage_checked
- [ ] Market status is updated from market_locked, market_resolved, market_cancelled
- [ ] Bet placement listens to bet_placed for confirmation
- [ ] Payout claims listen to winnings_claimed and refund_claimed
- [ ] Admin operations audit trail from admin_transferred and factory events
- [ ] Treasury operations audit trail from fee_withdrawn and emergency_drain
- [ ] Dispute workflow tracks market_disputed → dispute_resolved
- [ ] LP operations tracked from liquidity_added and liquidity_removed
- [ ] Error handling for partially indexed event streams
