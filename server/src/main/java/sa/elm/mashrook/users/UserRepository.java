package sa.elm.mashrook.users;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    @EntityGraph(attributePaths = {"organization", "authorities"})
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    @EntityGraph(attributePaths = {"organization", "authorities"})
    Optional<UserEntity> findUserEntityById(UUID id);

    /**
     * Find the first active user for an organization.
     * Used when we need a primary contact for the organization.
     */
    Optional<UserEntity> findFirstByOrganization_IdAndStatus(UUID organizationId, UserStatus status);

    /**
     * Find all users for an organization.
     * Used for sending notifications to organization members.
     */
    List<UserEntity> findAllByOrganization_IdAndStatus(UUID organizationId, UserStatus status);
}
