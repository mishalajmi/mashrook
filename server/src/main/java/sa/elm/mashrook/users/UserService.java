package sa.elm.mashrook.users;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.exceptions.UserAlreadyExistsException;
import sa.elm.mashrook.exceptions.UserNotFoundException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.users.domain.UserEntity;
import sa.elm.mashrook.users.domain.UserStatus;
import sa.elm.mashrook.users.dto.UserCreateRequest;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public Optional<UserEntity> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<UserEntity> findByUserId(UUID userId) {
        return userRepository.findUserEntityById(userId);
    }

    public boolean checkIfEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public UserEntity createUser(UserCreateRequest request, OrganizationEntity organization) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("email is already taken");
        }
        UserEntity user = UserEntity.from(request);
        user.setOrganization(organization);
        user.setPassword(encoder.encode(request.password()));
        userRepository.save(user);
        return user;
    }

    /**
     * Activates a user account by setting their status to ACTIVE.
     *
     * @param user the user to activate
     */
    @Transactional
    public void activateUser(UserEntity user) {
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        log.info("Activated user: {}", user.getEmail());
    }

    /**
     * Find the first active user for an organization.
     * Used as primary contact for notifications.
     *
     * @param organizationId the organization ID
     * @return the first active user, if any
     */
    public Optional<UserEntity> findFirstActiveUserByOrganizationId(UUID organizationId) {
        return userRepository.findFirstByOrganization_IdAndStatus(organizationId, UserStatus.ACTIVE);
    }

    public Optional<UserEntity> findByOrganizationId(UUID supplierId) {
        return userRepository.findFirstByOrganization_IdAndStatus(supplierId, UserStatus.ACTIVE);
    }
}
