package sa.elm.mashrook.security.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.security.details.MashrookUserDetails;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final AuthenticationConfigurationProperties properties;

    public String generateAccessToken(MashrookUserDetails user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "access");
        claims.put("organization_id", user.getOrganizationId().toString());
        claims.put("user_id", user.getUserUuid().toString());
        claims.put("status", user.getUserStatus());

        List<String> authorities = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        claims.put("authorities", authorities);
        return buildToken(user.getMashrookUsername(), claims, properties.jwt().accessTokenExpirationMs());
    }

    public String generateRefreshToken(MashrookUserDetails user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("user_id", user.getUserUuid().toString());
        return buildToken(user.getMashrookUsername(), claims,  properties.jwt().refreshTokenExpirationMs());
    }

    private String buildToken(String subject, Map<String, Object> claims, Long expiration) {
        Key signingKey = getSigningKey();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(subject)
                .claims(claims)
                .issuer(properties.jwt().issuer())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .notBefore(new Date())
                .audience().add("mashrook.sa").and()
                .signWith(signingKey)
                .compact();
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UUID extractUserId(String token) {
        String claim =  extractClaim(token, c -> c.get("user_id", String.class));
        return UUID.fromString(claim);
    }

    public UUID extractOrganizationId(String token) {
        String claim = extractClaim(token, c -> c.get("organization_id", String.class));
        return UUID.fromString(claim);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractAuthorities(String token) {
        return extractClaim(token, c -> c.get("authorities", ArrayList.class));
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        SecretKey key = getSigningKey();
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public boolean isAccessToken(String token) {
        return "access".equals(extractClaim(token, c -> c.get("type", String.class)));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(extractClaim(token, c -> c.get("type", String.class)));
    }


    private SecretKey getSigningKey() {
        byte[] bytes = properties.jwt().secret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(bytes);
    }
}
