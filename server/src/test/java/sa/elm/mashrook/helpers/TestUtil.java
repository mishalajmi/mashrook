package sa.elm.mashrook.helpers;

import lombok.experimental.UtilityClass;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@UtilityClass
public class TestUtil {

    public static OrganizationEntity organization(long id, UUID orgUuid, String nameEn, String nameAr,
                                                  String slug, String industry, OrganizationType type) {
        OrganizationEntity e = new OrganizationEntity();
        e.setId(id);
        e.setOrganizationId(orgUuid);
        e.setNameEn(nameEn);
        e.setNameAr(nameAr);
        e.setSlug(slug);
        e.setIndustry(industry);
        e.setType(type);
        e.setCreatedAt(LocalDateTime.of(2024,1,1,0,0)); // consistent deterministic timestamps
        e.setUpdatedAt(LocalDateTime.of(2024,1,2,0,0));
        return e;
    }

    public static List<OrganizationEntity> createMockOrganizations() {
        List<OrganizationEntity> list = new ArrayList<>();
        list.add(organization(1L, UUID.fromString("11111111-1111-1111-1111-111111111111"),
                "Acme Inc", "اكمي", "acme-inc", "Manufacturing", OrganizationType.BUYER));
        list.add(organization(2L, UUID.fromString("22222222-2222-2222-2222-222222222222"),
                "Public Co", "شركة عامة", "public-co", "Services", OrganizationType.SUPPLIER));
        list.add(organization(3L, UUID.fromString("33333333-3333-3333-3333-333333333333"),
                "Another", "آخر", "another", "Retail", OrganizationType.BUYER));
        return list;
    }
}
