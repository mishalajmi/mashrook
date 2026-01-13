package sa.elm.mashrook.addresses.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sa.elm.mashrook.addresses.domain.AddressEntity;
import sa.elm.mashrook.addresses.domain.AddressRepository;
import sa.elm.mashrook.addresses.dto.AddressCreateRequest;
import sa.elm.mashrook.addresses.dto.AddressResponse;
import sa.elm.mashrook.addresses.dto.AddressUpdateRequest;
import sa.elm.mashrook.exceptions.AddressNotFoundException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;
import sa.elm.mashrook.exceptions.OrganizationNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AddressService {

    private final AddressRepository addressRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public AddressResponse create(UUID organizationId, AddressCreateRequest request) {
        OrganizationEntity organization = findOrganizationOrThrow(organizationId);

        AddressEntity address = new AddressEntity();
        address.setOrganization(organization);
        address.setLabel(request.label());
        address.setStreetLine1(request.streetLine1());
        address.setStreetLine2(request.streetLine2());
        address.setCity(request.city());
        address.setStateProvince(request.stateProvince());
        address.setPostalCode(request.postalCode());
        address.setCountry(request.country() != null ? request.country() : "Saudi Arabia");

        // If this is marked as primary or if it's the first address, set as primary
        if (request.isPrimary() || !addressRepository.existsByOrganization_Id(organizationId)) {
            addressRepository.clearPrimaryForOrganization(organizationId);
            address.setPrimary(true);
        }

        AddressEntity saved = addressRepository.save(address);
        log.info("Created address {} for organization {}", saved.getId(), organizationId);

        return AddressResponse.from(saved);
    }

    @Transactional
    public AddressResponse update(UUID addressId, UUID organizationId, AddressUpdateRequest request) {
        AddressEntity address = findAddressOrThrow(addressId, organizationId);

        if (request.label() != null) {
            address.setLabel(request.label());
        }
        if (request.streetLine1() != null) {
            address.setStreetLine1(request.streetLine1());
        }
        if (request.streetLine2() != null) {
            address.setStreetLine2(request.streetLine2());
        }
        if (request.city() != null) {
            address.setCity(request.city());
        }
        if (request.stateProvince() != null) {
            address.setStateProvince(request.stateProvince());
        }
        if (request.postalCode() != null) {
            address.setPostalCode(request.postalCode());
        }
        if (request.country() != null) {
            address.setCountry(request.country());
        }

        AddressEntity saved = addressRepository.save(address);
        log.info("Updated address {}", addressId);

        return AddressResponse.from(saved);
    }

    @Transactional
    public void delete(UUID addressId, UUID organizationId) {
        AddressEntity address = findAddressOrThrow(addressId, organizationId);

        boolean wasPrimary = address.isPrimary();
        addressRepository.delete(address);

        log.info("Deleted address {}", addressId);

        // If we deleted the primary address, set another one as primary
        if (wasPrimary) {
            addressRepository.findAllByOrganization_IdOrderByIsPrimaryDescCreatedAtDesc(organizationId)
                    .stream()
                    .findFirst()
                    .ifPresent(newPrimary -> {
                        newPrimary.setPrimary(true);
                        addressRepository.save(newPrimary);
                        log.info("Set address {} as new primary for organization {}", newPrimary.getId(), organizationId);
                    });
        }
    }

    public List<AddressResponse> getByOrganization(UUID organizationId) {
        return addressRepository.findAllByOrganization_IdOrderByIsPrimaryDescCreatedAtDesc(organizationId)
                .stream()
                .map(AddressResponse::from)
                .toList();
    }

    public AddressResponse getById(UUID addressId, UUID organizationId) {
        AddressEntity address = findAddressOrThrow(addressId, organizationId);
        return AddressResponse.from(address);
    }

    public Optional<AddressResponse> getPrimary(UUID organizationId) {
        return addressRepository.findByOrganization_IdAndIsPrimaryTrue(organizationId)
                .map(AddressResponse::from);
    }

    @Transactional
    public AddressResponse setPrimary(UUID addressId, UUID organizationId) {
        AddressEntity address = findAddressOrThrow(addressId, organizationId);

        addressRepository.clearPrimaryForOrganization(organizationId);
        address.setPrimary(true);

        AddressEntity saved = addressRepository.save(address);
        log.info("Set address {} as primary for organization {}", addressId, organizationId);

        return AddressResponse.from(saved);
    }

    public boolean hasAddress(UUID organizationId) {
        return addressRepository.existsByOrganization_Id(organizationId);
    }

    public Optional<AddressEntity> findPrimaryAddress(UUID organizationId) {
        return addressRepository.findByOrganization_IdAndIsPrimaryTrue(organizationId);
    }

    public Optional<AddressEntity> findById(UUID addressId) {
        return addressRepository.findById(addressId);
    }

    private AddressEntity findAddressOrThrow(UUID addressId, UUID organizationId) {
        return addressRepository.findByIdAndOrganization_Id(addressId, organizationId)
                .orElseThrow(() -> new AddressNotFoundException(
                        String.format("Address with id %s not found for organization %s", addressId, organizationId)));
    }

    private OrganizationEntity findOrganizationOrThrow(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new OrganizationNotFoundException(
                        String.format("Organization with id %s not found", organizationId)));
    }
}
