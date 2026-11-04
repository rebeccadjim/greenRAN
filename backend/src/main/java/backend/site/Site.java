package backend.site;

import jakarta.persistence.*;

@Entity
@Table(name = "site")
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private double lat;
    private double lon;
    private String technology;
    private String status;
    private int cells;

    protected Site() { }  // requis par JPA

    public Long getId() { return id; }
    public String getName() { return name; }
    public double getLat() { return lat; }
    public double getLon() { return lon; }
    public String getTechnology() { return technology; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}