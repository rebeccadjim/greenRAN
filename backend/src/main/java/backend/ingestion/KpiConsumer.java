package backend.ingestion;

import backend.config.KafkaConfig;
import backend.site.SiteMetric;
import backend.site.SiteMetricId;
import backend.site.SiteMetricRepository;
import java.time.Instant;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class KpiConsumer {

    private final SiteMetricRepository metricRepository;

    public KpiConsumer(SiteMetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }

    @KafkaListener(topics = KafkaConfig.KPI_RAW_TOPIC)
    public void onMessage(String payload) {

        String[] p = payload.split(",");

        if (p.length != 6) {
            throw new IllegalArgumentException(
                    "Format KPI invalide : 6 champs attendus, " + p.length + " reçus"
            );
        }

        SiteMetricId id = new SiteMetricId(
                Long.parseLong(p[0]),
                Instant.ofEpochMilli(Long.parseLong(p[1]))
        );

        SiteMetric metric = new SiteMetric(
                id,
                Double.valueOf(p[2]),
                Double.valueOf(p[3]),
                Double.valueOf(p[4]),
                Double.valueOf(p[5])
        );

        metricRepository.save(metric);
    }
}