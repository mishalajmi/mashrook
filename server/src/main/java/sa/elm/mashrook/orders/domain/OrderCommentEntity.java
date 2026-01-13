package sa.elm.mashrook.orders.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.users.domain.UserEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "order_comments")
public class OrderCommentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "order_id")
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "organization_id")
    private OrganizationEntity organization;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, name = "is_internal")
    private boolean isInternal = false;

    @CreatedDate
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static OrderCommentEntity create(OrderEntity order, UserEntity user, OrganizationEntity organization,
                                            String content, boolean isInternal) {
        OrderCommentEntity comment = new OrderCommentEntity();
        comment.setOrder(order);
        comment.setUser(user);
        comment.setOrganization(organization);
        comment.setContent(content);
        comment.setInternal(isInternal);
        return comment;
    }
}
