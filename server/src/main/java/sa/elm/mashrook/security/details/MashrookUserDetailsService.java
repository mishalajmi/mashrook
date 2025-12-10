package sa.elm.mashrook.security.details;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.users.UserService;

@Service
@RequiredArgsConstructor
public class MashrookUserDetailsService implements UserDetailsService {

    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userService
                .findByEmail(email)
                .map(MashrookUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid Credentials"));
    }
}
