package sa.elm.mashrook.organizations;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ArgumentsSource;
import org.mockito.Mock;
import sa.elm.mashrook.helpers.TestUtil;
import sa.elm.mashrook.organizations.domain.OrganizationRepository;

import java.util.List;

class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @BeforeEach
    void setUp() {
        organizationRepository.deleteAll();
        organizationRepository.saveAll(TestUtil.createMockOrganizations());
    }

    @AfterEach
    void tearDown() {
    }
}