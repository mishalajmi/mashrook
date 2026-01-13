package sa.elm.mashrook.orders.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import sa.elm.mashrook.users.domain.UserEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "cancellation_requests")
public class CancellationRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "order_id")
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "requested_by_id")
    private UserEntity requestedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status", length = 50)
    private CancellationRequestStatus status = CancellationRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private UserEntity reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static CancellationRequestEntity create(OrderEntity order, UserEntity requestedBy, String reason) {
        CancellationRequestEntity request = new CancellationRequestEntity();
        request.setOrder(order);
        request.setRequestedBy(requestedBy);
        request.setReason(reason);
        request.setStatus(CancellationRequestStatus.PENDING);
        return request;
    }

    public void approve(UserEntity reviewedBy, String notes) {
        this.status = CancellationRequestStatus.APPROVED;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = LocalDateTime.now();
        this.reviewNotes = notes;
    }

    public void reject(UserEntity reviewedBy, String notes) {
        this.status = CancellationRequestStatus.REJECTED;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = LocalDateTime.now();
        this.reviewNotes = notes;
    }
}
