package sa.elm.mashrook.addresses.dto;

import sa.elm.mashrook.addresses.domain.AddressEntity;

import java.time.LocalDateTime;
import java.util.UUID;

public record AddressResponse(
        UUID id,
        UUID organizationId,
        String label,
        String streetLine1,
        String streetLine2,
        String city,
        String stateProvince,
        String postalCode,
        String country,
        boolean isPrimary,
        String formattedAddress,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static AddressResponse from(AddressEntity entity) {
        return new AddressResponse(
                entity.getId(),
                entity.getOrganization().getId(),
                entity.getLabel(),
                entity.getStreetLine1(),
                entity.getStreetLine2(),
                entity.getCity(),
                entity.getStateProvince(),
                entity.getPostalCode(),
                entity.getCountry(),
                entity.isPrimary(),
                entity.getFormattedAddress(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
