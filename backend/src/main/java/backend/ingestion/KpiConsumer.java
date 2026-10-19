package backend.ingestion;

import backend.config.KafkaConfig;
import backend.site.SiteMetric;
import backend.site.SiteMetricId;
import backend.site.SiteMetricRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class KpiConsumer {

    private static final Logger log = LoggerFactory.getLogger(KpiConsumer.class);

    private final SiteMetricRepository metricRepository;

    public KpiConsumer(SiteMetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }

    // Spring appelle cette méthode pour chaque message arrivant sur le topic
    @KafkaListener(topics = KafkaConfig.KPI_RAW_TOPIC)
    public void onMessage(String payload) {
        try {
            String[] p = payload.split(",");
            SiteMetricId id = new SiteMetricId(Long.parseLong(p[0]), Instant.ofEpochMilli(Long.parseLong(p[1])));
            SiteMetric metric = new SiteMetric(id,
                    Double.valueOf(p[2]), Double.valueOf(p[3]),
                    Double.valueOf(p[4]), Double.valueOf(p[5]));
            metricRepository.save(metric);
        } catch (RuntimeException e) {
            // Un message illisible ne doit pas bloquer la file : on le signale et on passe au suivant
            log.warn("Message KPI ignoré : '{}' ({})", payload, e.getMessage());
        }
    }
}