package sa.elm.mashrook.users;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import sa.elm.mashrook.users.domain.UserEntity;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    @EntityGraph(attributePaths = {"organization", "authorities"})
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    @EntityGraph(attributePaths = {"organization", "authorities"})
    Optional<UserEntity> findByUserId(UUID userId);

}
