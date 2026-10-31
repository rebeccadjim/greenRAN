package backend.site;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteQueryService service;

    public SiteController(SiteQueryService service) {
        this.service = service;
    }

    @GetMapping
    public List<SiteView> list() {
        return service.findAllWithLatest();
    }

    @GetMapping("/{id}/metrics")
    public List<MetricPoint> metrics(
            @PathVariable long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "5m") String bucket) {

        if (!service.exists(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site inconnu : " + id);
        }
        if (!SiteQueryService.isValidBucket(bucket)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "bucket invalide, valeurs possibles : 1m, 5m, 15m, 1h, 1d");
        }

        // Par défaut : les dernières 24 heures
        Instant end = (to != null) ? to : Instant.now();
        Instant start = (from != null) ? from : end.minus(24, ChronoUnit.HOURS);

        if (!start.isBefore(end)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from doit être antérieur à to");
        }
        return service.metrics(id, start, end, bucket);
    }
}