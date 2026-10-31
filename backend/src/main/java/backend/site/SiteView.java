package backend.site;

import java.time.Instant;

public record SiteView(
        Long id,
        String name,
        double lat,
        double lon,
        String technology,
        String status,
        LatestKpi latest
) {
    // Dernière mesure connue du site (null si aucune mesure n'a encore été reçue)
    public record LatestKpi(
            Instant time,
            double trafficMbps,
            double prbLoadPct,
            double energyKwh,
            double temperatureC
    ) { }
}