// FIKRION Monitor Module
// Provides real system telemetry using the `sysinfo` crate.
// Design decision: We use sysinfo because it is cross-platform (Windows + Linux)
// and does NOT require elevated privileges for basic process/metric data.

pub mod metrics;
pub mod process;
pub mod events;
