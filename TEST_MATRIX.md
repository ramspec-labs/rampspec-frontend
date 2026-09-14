# Frontend Test Matrix

| Journey | Local automated coverage | Browser/visual gate |
| --- | --- | --- |
| Onboarding | Typecheck and component state checks | Keyboard and phone viewport smoke |
| Safe run creation | Parameter and idempotency unit checks | Duplicate-submit and reconnect journey |
| Report verification | Signature and coverage unit checks | Evidence lookup and triage journey |
| Permission states | Capability matrix unit checks | Screen-reader denied-state smoke |

Run `pnpm verify` for the local deterministic gate. Live backend, wallet, RPC,
and visual-regression checks require their corresponding environment fixtures.
