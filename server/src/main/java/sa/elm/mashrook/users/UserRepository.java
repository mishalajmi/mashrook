package sa.elm.mashrook.users;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import sa.elm.mashrook.users.domain.UserEntity;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    @EntityGraph(attributePaths = {"organization", "authorities"})
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    @EntityGraph(attributePaths = {"organization", "authorities"})
    Optional<UserEntity> findUserEntityById(UUID id);

}
