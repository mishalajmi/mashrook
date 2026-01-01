package sa.elm.mashrook.security.domain;

/**
 * Represents the resources in the system that can have permissions applied.
 *
 * <p>Resources are combined with {@link Permission} to form complete resource-permission
 * pairs (e.g., "ORGANIZATIONS:READ", "CAMPAIGNS:WRITE").</p>
 *
 * <h2>Resource Naming Convention</h2>
 * <ul>
 *   <li>Enum names use SCREAMING_SNAKE_CASE (e.g., USER_MANAGEMENT)</li>
 *   <li>String values use lowercase kebab-case (e.g., "user-management")</li>
 * </ul>
 *
 * @see Permission
 * @see ResourcePermission
 */
public enum Resource {

    DASHBOARD("dashboard"),
    PRODUCTS("products"),
    ORDERS("orders"),
    CAMPAIGNS("campaigns"),
    ANALYTICS("analytics"),
    BUYERS("buyers"),
    SUPPLIERS("suppliers"),
    MESSAGES("messages"),
    SETTINGS("settings"),
    PROCUREMENTS("procurements"),
    TEAM("teams"),
    USER_MANAGEMENT("user-management"),
    ORGANIZATIONS("organizations"),
    SYSTEM_SETTINGS("system-settings"),
    REPORTS("reports"),
    MODERATION("moderation"),
    COMMUNICATIONS("communications"),
    CONFIGURATION("configuration"),
    BRACKETS("brackets"),
    PLEDGES("pledges"),
    PAYMENTS("payments");

    private final String resource;

    Resource(String resource) {
        this.resource = resource;
    }

    /**
     * Returns the lowercase kebab-case string representation of this resource.
     *
     * @return the resource string (e.g., "user-management", "organizations")
     */
    public String getResource() {
        return resource;
    }

    /**
     * Looks up a Resource by its string value (case-insensitive).
     *
     * @param resourceValue the resource string to look up
     * @return the matching Resource enum value
     * @throws IllegalArgumentException if no matching resource is found
     */
    public static Resource fromString(String resourceValue) {
        for (Resource r : Resource.values()) {
            if (r.resource.equalsIgnoreCase(resourceValue) || r.name().equalsIgnoreCase(resourceValue)) {
                return r;
            }
        }
        throw new IllegalArgumentException("Resource not found: " + resourceValue);
    }

    /**
     * Alias for fromString for backward compatibility.
     *
     * @param resourceValue the resource string to look up
     * @return the matching Resource enum value
     * @throws IllegalArgumentException if no matching resource is found
     * @deprecated Use {@link #fromString(String)} instead
     */
    @Deprecated
    public static Resource getResource(String resourceValue) {
        return fromString(resourceValue);
    }
}
