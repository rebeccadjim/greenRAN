package backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String KPI_RAW_TOPIC = "kpi.raw";

    @Bean
    NewTopic kpiRawTopic() {
        return TopicBuilder.name(KPI_RAW_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}