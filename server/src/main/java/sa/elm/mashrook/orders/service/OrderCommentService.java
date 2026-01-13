package sa.elm.mashrook.orders.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.exceptions.OrderNotFoundException;
import sa.elm.mashrook.orders.domain.OrderCommentEntity;
import sa.elm.mashrook.orders.domain.OrderCommentRepository;
import sa.elm.mashrook.orders.domain.OrderEntity;
import sa.elm.mashrook.orders.domain.OrderRepository;
import sa.elm.mashrook.orders.dto.OrderCommentRequest;
import sa.elm.mashrook.orders.dto.OrderCommentResponse;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.users.domain.UserEntity;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderCommentService {

    private final OrderCommentRepository commentRepository;
    private final OrderRepository orderRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public OrderCommentResponse addComment(UUID orderId, OrderCommentRequest request,
                                           UserEntity user, UUID organizationId) {
        OrderEntity order = findOrderOrThrow(orderId);
        OrganizationEntity organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        OrderCommentEntity comment = OrderCommentEntity.create(
                order,
                user,
                organization,
                request.content(),
                request.isInternal()
        );

        OrderCommentEntity saved = commentRepository.save(comment);
        log.info("Added comment {} to order {} by user {}", saved.getId(), orderId, user.getId());

        return OrderCommentResponse.from(saved);
    }

    public List<OrderCommentResponse> getComments(UUID orderId, UUID organizationId, boolean includeInternal) {
        OrderEntity order = findOrderOrThrow(orderId);

        List<OrderCommentEntity> comments;

        if (includeInternal) {
            // If including internal, get all comments (supplier viewing their own)
            comments = commentRepository.findAllByOrder_IdOrderByCreatedAtDesc(orderId);
        } else {
            // Only get non-internal comments (buyer viewing)
            comments = commentRepository.findAllByOrder_IdAndIsInternalFalseOrderByCreatedAtDesc(orderId);
        }

        return comments.stream()
                .map(OrderCommentResponse::from)
                .toList();
    }

    /**
     * Get comments visible to a specific organization.
     * Internal comments are only visible to the organization that created them.
     */
    public List<OrderCommentResponse> getVisibleComments(UUID orderId, UUID viewerOrgId) {
        OrderEntity order = findOrderOrThrow(orderId);

        // Get all non-internal comments plus internal comments from the viewer's org
        List<OrderCommentEntity> allComments = commentRepository.findAllByOrder_IdOrderByCreatedAtDesc(orderId);

        return allComments.stream()
                .filter(comment -> !comment.isInternal() ||
                        comment.getOrganization().getId().equals(viewerOrgId))
                .map(OrderCommentResponse::from)
                .toList();
    }

    private OrderEntity findOrderOrThrow(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        String.format("Order with id %s not found", orderId)));
    }
}
