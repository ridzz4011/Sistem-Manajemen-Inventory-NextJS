# Conversion Examples

These files live under the default V-Rule application home:
`$VRULE_HOME/examples`, where the development default is
`vastar_home/vrule/examples`.

The DMN 1.5 files are curated for V-Rule Studio conversion demos.
They cover business-grade decision tables with numeric comparisons,
ranges, enumerations, boolean flags, wildcard fallback rules, and
multi-output decisions.

## DMN sources

- `dmn/01-retail-credit-limit-eligibility.dmn`
- `dmn/02-commercial-loan-covenant-monitor.dmn`
- `dmn/03-insurance-claim-triage.dmn`
- `dmn/04-payment-fraud-control.dmn`
- `dmn/05-supplier-risk-onboarding.dmn`
- `dmn/06-healthcare-prior-authorization.dmn`
- `dmn/07-subscription-retention-offer.dmn`
- `dmn/08-aml-case-prioritization.dmn`
- `dmn/09-logistics-exception-routing.dmn`
- `dmn/10-data-privacy-request-sla.dmn`

Each file is intentionally independent so it can be selected directly
from Convert -> DMN 1.5 (XML) -> Choose source.

## Generated references

- `vdicl/` contains timestamp-prefixed VDICL YAML imported from DMN.
- `vdicl/xlsx_ouput/` contains Excel exports generated from the VDICL files.
