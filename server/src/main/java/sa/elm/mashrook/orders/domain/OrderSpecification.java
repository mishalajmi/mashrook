package sa.elm.mashrook.orders.domain;

import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Specifications for dynamic filtering of OrderEntity queries.
 * <p>
 * This class provides static factory methods that return Specification instances
 * for building type-safe, composable queries. Each method handles null parameters
 * gracefully by returning a no-op predicate (conjunction).
 * </p>
 */
public final class OrderSpecification {

    private OrderSpecification() {
        // Utility class - prevent instantiation
    }

    /**
     * Creates a specification to filter orders by buyer organization ID.
     *
     * @param buyerOrgId the buyer organization ID to filter by, or null to skip this filter
     * @return a Specification that filters by buyer organization ID, or a no-op if null
     */
    public static Specification<OrderEntity> withBuyerOrgId(UUID buyerOrgId) {
        return (root, query, criteriaBuilder) -> {
            if (buyerOrgId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("buyerOrganization").get("id"), buyerOrgId);
        };
    }

    /**
     * Creates a specification to filter orders by supplier organization ID.
     *
     * @param supplierOrgId the supplier organization ID to filter by, or null to skip this filter
     * @return a Specification that filters by supplier organization ID, or a no-op if null
     */
    public static Specification<OrderEntity> withSupplierOrgId(UUID supplierOrgId) {
        return (root, query, criteriaBuilder) -> {
            if (supplierOrgId == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("supplierOrganization").get("id"), supplierOrgId);
        };
    }

    /**
     * Creates a specification to filter orders by status.
     *
     * @param status the order status to filter by, or null to skip this filter
     * @return a Specification that filters by status, or a no-op if null
     */
    public static Specification<OrderEntity> withStatus(OrderStatus status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    /**
     * Creates a specification to filter orders created after a given date/time.
     *
     * @param dateTime the date/time threshold, or null to skip this filter
     * @return a Specification that filters orders created on or after the given date/time, or a no-op if null
     */
    public static Specification<OrderEntity> createdAfter(LocalDateTime dateTime) {
        return (root, query, criteriaBuilder) -> {
            if (dateTime == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateTime);
        };
    }
}
