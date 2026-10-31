package backend.site;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SiteQueryService {

    // Liste blanche : la valeur du paramètre ?bucket= est traduite en intervalle PostgreSQL.
    // Rien de ce que tape l'utilisateur n'est recopié tel quel dans le SQL.
    private static final Map<String, String> BUCKETS = Map.of(
            "1m", "1 minute",
            "5m", "5 minutes",
            "15m", "15 minutes",
            "1h", "1 hour",
            "1d", "1 day");

    private final JdbcTemplate jdbc;

    public SiteQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static boolean isValidBucket(String key) {
        return BUCKETS.containsKey(key);
    }

    public boolean exists(long siteId) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM site WHERE id = ?", Integer.class, siteId);
        return n != null && n > 0;
    }

    // Tous les sites avec leur dernière mesure
    public List<SiteView> findAllWithLatest() {
        String sql = """
                SELECT s.id, s.name, s.lat, s.lon, s.technology, s.status,
                       m.time AS m_time, m.traffic_mbps, m.prb_load_pct, m.energy_kwh, m.temperature_c
                FROM site s
                LEFT JOIN LATERAL (
                    SELECT * FROM site_metric
                    WHERE site_id = s.id
                    ORDER BY time DESC
                    LIMIT 1
                ) m ON true
                ORDER BY s.id
                """;
        return jdbc.query(sql, (rs, i) -> {
            OffsetDateTime t = rs.getObject("m_time", OffsetDateTime.class);
            SiteView.LatestKpi latest = (t == null) ? null : new SiteView.LatestKpi(
                    t.toInstant(),
                    rs.getDouble("traffic_mbps"),
                    rs.getDouble("prb_load_pct"),
                    rs.getDouble("energy_kwh"),
                    rs.getDouble("temperature_c"));
            return new SiteView(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getDouble("lat"),
                    rs.getDouble("lon"),
                    rs.getString("technology"),
                    rs.getString("status"),
                    latest);
        });
    }

    // Historique d'un site, agrégé par intervalle
    public List<MetricPoint> metrics(long siteId, Instant from, Instant to, String bucketKey) {
        String sql = """
                SELECT time_bucket(CAST(? AS interval), time) AS bucket,
                       avg(traffic_mbps)  AS traffic_mbps,
                       avg(prb_load_pct)  AS prb_load_pct,
                       sum(energy_kwh)    AS energy_kwh,
                       avg(temperature_c) AS temperature_c
                FROM site_metric
                WHERE site_id = ? AND time >= ? AND time < ?
                GROUP BY bucket
                ORDER BY bucket
                """;
        return jdbc.query(sql, (rs, i) -> new MetricPoint(
                        rs.getObject("bucket", OffsetDateTime.class).toInstant(),
                        rs.getDouble("traffic_mbps"),
                        rs.getDouble("prb_load_pct"),
                        rs.getDouble("energy_kwh"),
                        rs.getDouble("temperature_c")),
                BUCKETS.get(bucketKey), siteId, Timestamp.from(from), Timestamp.from(to));
    }
}