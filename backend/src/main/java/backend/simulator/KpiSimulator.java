package backend.simulator;

import backend.config.KafkaConfig;
import backend.site.Site;
import backend.site.SiteRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class KpiSimulator {

    private static final int INTERVAL_SECONDS = 10;
    private static final ZoneId ZONE = ZoneId.of("Europe/Paris");

    private final SiteRepository siteRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public KpiSimulator(SiteRepository siteRepository, KafkaTemplate<String, String> kafkaTemplate) {
        this.siteRepository = siteRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    // Toutes les 10 secondes : une mesure par site, envoyée dans Kafka
    @Scheduled(fixedRate = INTERVAL_SECONDS * 1000L)
    public void emitMeasures() {
        Instant now = Instant.now();
        double hour = hourOfDay(now);

        for (Site site : siteRepository.findAll()) {
            String payload = buildPayload(site, now, hour);
            // La clé = id du site : tous les messages d'un même site vont dans la même partition,
            // donc ils sont lus dans l'ordre.
            kafkaTemplate.send(KafkaConfig.KPI_RAW_TOPIC, String.valueOf(site.getId()), payload);
        }
    }

    private String buildPayload(Site site, Instant now, double hour) {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        boolean is5g = "5G".equals(site.getTechnology());

        // Profil journalier : petit niveau de base + pic de midi + pic de soirée
        double profile = 0.15 + 0.45 * gauss(hour, 12.5, 3.0) + 0.40 * gauss(hour, 20.0, 2.5);

        // Chaque site a son propre niveau d'activité (entre 0.6 et 1.19), stable dans le temps
        double siteFactor = 0.6 + ((site.getId() * 37) % 60) / 100.0;

        // Un peu de bruit aléatoire (environ 5 %), puis on borne la charge entre 2 % et 100 %
        double noise = 1 + rnd.nextGaussian() * 0.05;
        double load = Math.max(0.02, Math.min(1.0, profile * siteFactor * noise));

        double capacityMbps = is5g ? 600 : 150;
        double baseKw = is5g ? 3.0 : 1.8;
        double dynamicKw = is5g ? 2.0 : 1.0;

        double traffic = load * capacityMbps;
        double prbLoad = load * 100;
        double powerKw = baseKw + dynamicKw * load;
        double energyKwh = powerKw * INTERVAL_SECONDS / 3600.0;  // énergie consommée pendant l'intervalle
        double temperature = 30 + 25 * load + rnd.nextGaussian() * 0.8;

        // Une anomalie très rare : surconsommation et surchauffe (servira à la détection plus tard)
        if (rnd.nextDouble() < 0.003) {
            energyKwh *= 2.5;
            temperature += 20;
        }

        // Locale.ROOT : force le point comme séparateur décimal (sinon "12,5" en locale française)
        return String.format(Locale.ROOT, "%d,%d,%.2f,%.2f,%.4f,%.2f",
                site.getId(), now.toEpochMilli(), traffic, prbLoad, energyKwh, temperature);
    }

    private static double hourOfDay(Instant instant) {
        ZonedDateTime t = instant.atZone(ZONE);
        return t.getHour() + t.getMinute() / 60.0;
    }

    // Courbe en cloche centrée sur mu : vaut 1 en mu et retombe vers 0 en s'éloignant
    private static double gauss(double x, double mu, double sigma) {
        double d = (x - mu) / sigma;
        return Math.exp(-0.5 * d * d);
    }
}