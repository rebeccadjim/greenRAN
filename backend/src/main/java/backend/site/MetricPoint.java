package backend.site;

import java.time.Instant;

public record MetricPoint(
        Instant time,
        double trafficMbps,
        double prbLoadPct,
        double energyKwh,
        double temperatureC
) { }