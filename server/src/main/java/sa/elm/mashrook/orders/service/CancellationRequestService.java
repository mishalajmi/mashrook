package sa.elm.mashrook.orders.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.exceptions.CancellationRequestNotFoundException;
import sa.elm.mashrook.exceptions.OrderNotFoundException;
import sa.elm.mashrook.exceptions.OrderValidationException;
import sa.elm.mashrook.orders.domain.CancellationRequestEntity;
import sa.elm.mashrook.orders.domain.CancellationRequestRepository;
import sa.elm.mashrook.orders.domain.CancellationRequestStatus;
import sa.elm.mashrook.orders.domain.OrderEntity;
import sa.elm.mashrook.orders.domain.OrderRepository;
import sa.elm.mashrook.orders.dto.CancellationRequestResponse;
import sa.elm.mashrook.users.domain.UserEntity;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CancellationRequestService {

    private final CancellationRequestRepository cancellationRequestRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Transactional
    public CancellationRequestResponse createRequest(UUID orderId, String reason, UserEntity requestedBy) {
        OrderEntity order = findOrderOrThrow(orderId);

        // Check if order can be cancelled
        if (!order.getStatus().allowsCancellation()) {
            throw new OrderValidationException(
                    String.format("Order in status %s cannot be cancelled", order.getStatus()));
        }

        // Check if there's already a pending cancellation request
        if (cancellationRequestRepository.existsByOrder_IdAndStatus(orderId, CancellationRequestStatus.PENDING)) {
            throw new OrderValidationException("A cancellation request is already pending for this order");
        }

        CancellationRequestEntity request = CancellationRequestEntity.create(order, requestedBy, reason);
        CancellationRequestEntity saved = cancellationRequestRepository.save(request);

        log.info("Created cancellation request {} for order {} by user {}",
                saved.getId(), orderId, requestedBy.getId());

        return CancellationRequestResponse.from(saved);
    }

    @Transactional
    public CancellationRequestResponse approveRequest(UUID requestId, String notes, UserEntity reviewedBy) {
        CancellationRequestEntity request = findRequestOrThrow(requestId);

        if (request.getStatus() != CancellationRequestStatus.PENDING) {
            throw new OrderValidationException("This cancellation request has already been reviewed");
        }

        request.approve(reviewedBy, notes);
        cancellationRequestRepository.save(request);

        // Cancel the order
        OrderEntity order = request.getOrder();
        orderService.cancelOrder(
                order.getId(),
                "Cancellation request approved: " + request.getReason(),
                reviewedBy
        );

        log.info("Approved cancellation request {} by user {}", requestId, reviewedBy.getId());

        return CancellationRequestResponse.from(request);
    }

    @Transactional
    public CancellationRequestResponse rejectRequest(UUID requestId, String notes, UserEntity reviewedBy) {
        CancellationRequestEntity request = findRequestOrThrow(requestId);

        if (request.getStatus() != CancellationRequestStatus.PENDING) {
            throw new OrderValidationException("This cancellation request has already been reviewed");
        }

        request.reject(reviewedBy, notes);
        cancellationRequestRepository.save(request);

        log.info("Rejected cancellation request {} by user {}", requestId, reviewedBy.getId());

        return CancellationRequestResponse.from(request);
    }

    public List<CancellationRequestResponse> getRequestsForOrder(UUID orderId) {
        findOrderOrThrow(orderId);
        return cancellationRequestRepository.findAllByOrder_IdOrderByCreatedAtDesc(orderId)
                .stream()
                .map(CancellationRequestResponse::from)
                .toList();
    }

    public Page<CancellationRequestResponse> getPendingRequestsForSupplier(UUID supplierOrgId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return cancellationRequestRepository
                .findAllByOrder_SupplierOrganization_IdAndStatusOrderByCreatedAtDesc(
                        supplierOrgId, CancellationRequestStatus.PENDING, pageable)
                .map(CancellationRequestResponse::from);
    }

    public long countPendingRequestsForSupplier(UUID supplierOrgId) {
        return cancellationRequestRepository.countByOrder_SupplierOrganization_IdAndStatus(
                supplierOrgId, CancellationRequestStatus.PENDING);
    }

    public CancellationRequestResponse getById(UUID requestId) {
        CancellationRequestEntity request = findRequestOrThrow(requestId);
        return CancellationRequestResponse.from(request);
    }

    private OrderEntity findOrderOrThrow(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(
                        String.format("Order with id %s not found", orderId)));
    }

    private CancellationRequestEntity findRequestOrThrow(UUID requestId) {
        return cancellationRequestRepository.findById(requestId)
                .orElseThrow(() -> new CancellationRequestNotFoundException(
                        String.format("Cancellation request with id %s not found", requestId)));
    }
}
