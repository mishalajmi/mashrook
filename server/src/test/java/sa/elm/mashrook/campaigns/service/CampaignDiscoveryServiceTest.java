package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.domain.DiscountBracketEntity;
import sa.elm.mashrook.campaigns.dto.BracketProgressResponse;
import sa.elm.mashrook.campaigns.dto.CampaignListResponse;
import sa.elm.mashrook.campaigns.dto.CampaignPublicResponse;
import sa.elm.mashrook.common.uuid.UuidGenerator;
import sa.elm.mashrook.exceptions.CampaignNotFoundException;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampaignDiscoveryService Tests")
class CampaignDiscoveryServiceTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private BracketEvaluationService bracketEvaluationService;

    @Mock
    private OrganizationService organizationService;

    private CampaignDiscoveryService campaignDiscoveryService;

    private UUID campaignId;
    private UUID supplierId;

    @BeforeEach
    void setUp() {
        campaignDiscoveryService = new CampaignDiscoveryService(
                campaignRepository,
                bracketEvaluationService,
                organizationService
        );
        campaignId = UuidGenerator.generateUuidV7();
        supplierId = UuidGenerator.generateUuidV7();
    }

    @Nested
    @DisplayName("findActiveCampaigns")
    class FindActiveCampaigns {

        @Test
        @DisplayName("should return paginated list of active campaigns")
        void shouldReturnPaginatedListOfActiveCampaigns() {
            CampaignEntity campaign = createCampaign(CampaignStatus.ACTIVE);
            OrganizationEntity supplier = createSupplier();

            when(campaignRepository.findAllByStatus(CampaignStatus.ACTIVE))
                    .thenReturn(List.of(campaign));
            when(organizationService.findById(supplierId)).thenReturn(supplier);
            when(bracketEvaluationService.calculateTotalPledged(campaignId)).thenReturn(50);
            when(bracketEvaluationService.getAllBrackets(campaignId)).thenReturn(createBrackets());
            when(bracketEvaluationService.getUnitPriceForQuantity(campaignId, 50))
                    .thenReturn(Optional.of(new BigDecimal("90.00")));

            Pageable pageable = PageRequest.of(0, 20);
            CampaignListResponse result = campaignDiscoveryService.findActiveCampaigns(null, null, pageable);

            assertThat(result.campaigns()).hasSize(1);
            assertThat(result.campaigns().getFirst().id()).isEqualTo(campaignId);
            assertThat(result.campaigns().getFirst().supplierName()).isEqualTo("Test Supplier");
            assertThat(result.page().totalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("should filter campaigns by title search")
        void shouldFilterCampaignsByTitleSearch() {
            CampaignEntity campaign1 = createCampaign(CampaignStatus.ACTIVE);
            campaign1.setTitle("Laptop Campaign");

            CampaignEntity campaign2 = createCampaign(CampaignStatus.ACTIVE);
            campaign2.setId(UuidGenerator.generateUuidV7());
            campaign2.setTitle("Phone Campaign");

            OrganizationEntity supplier = createSupplier();

            when(campaignRepository.findAllByStatus(CampaignStatus.ACTIVE))
                    .thenReturn(List.of(campaign1, campaign2));
            when(organizationService.findById(supplierId)).thenReturn(supplier);
            when(bracketEvaluationService.calculateTotalPledged(campaign1.getId())).thenReturn(0);
            when(bracketEvaluationService.getAllBrackets(campaign1.getId())).thenReturn(createBrackets());
            when(bracketEvaluationService.getUnitPriceForQuantity(campaign1.getId(), 0))
                    .thenReturn(Optional.of(new BigDecimal("100.00")));

            Pageable pageable = PageRequest.of(0, 20);
            CampaignListResponse result = campaignDiscoveryService.findActiveCampaigns("laptop", null, pageable);

            assertThat(result.campaigns()).hasSize(1);
            assertThat(result.campaigns().getFirst().title()).isEqualTo("Laptop Campaign");
        }

        @Test
        @DisplayName("should filter campaigns by supplier ID")
        void shouldFilterCampaignsBySupplierId() {
            CampaignEntity campaign1 = createCampaign(CampaignStatus.ACTIVE);
            UUID otherSupplierId = UuidGenerator.generateUuidV7();

            CampaignEntity campaign2 = createCampaign(CampaignStatus.ACTIVE);
            campaign2.setId(UuidGenerator.generateUuidV7());
            campaign2.setSupplierId(otherSupplierId);

            OrganizationEntity supplier = createSupplier();

            when(campaignRepository.findAllByStatus(CampaignStatus.ACTIVE))
                    .thenReturn(List.of(campaign1, campaign2));
            when(organizationService.findById(supplierId)).thenReturn(supplier);
            when(bracketEvaluationService.calculateTotalPledged(campaign1.getId())).thenReturn(0);
            when(bracketEvaluationService.getAllBrackets(campaign1.getId())).thenReturn(createBrackets());
            when(bracketEvaluationService.getUnitPriceForQuantity(campaign1.getId(), 0))
                    .thenReturn(Optional.of(new BigDecimal("100.00")));

            Pageable pageable = PageRequest.of(0, 20);
            CampaignListResponse result = campaignDiscoveryService.findActiveCampaigns(null, supplierId, pageable);

            assertThat(result.campaigns()).hasSize(1);
            assertThat(result.campaigns().getFirst().supplierId()).isEqualTo(supplierId);
        }

        @Test
        @DisplayName("should return empty list when no active campaigns exist")
        void shouldReturnEmptyListWhenNoActiveCampaigns() {
            when(campaignRepository.findAllByStatus(CampaignStatus.ACTIVE))
                    .thenReturn(List.of());

            Pageable pageable = PageRequest.of(0, 20);
            CampaignListResponse result = campaignDiscoveryService.findActiveCampaigns(null, null, pageable);

            assertThat(result.campaigns()).isEmpty();
            assertThat(result.page().totalElements()).isZero();
        }
    }

    @Nested
    @DisplayName("getPublicCampaignDetails")
    class GetPublicCampaignDetails {

        @Test
        @DisplayName("should return public campaign details for active campaign")
        void shouldReturnPublicCampaignDetailsForActiveCampaign() {
            CampaignEntity campaign = createCampaign(CampaignStatus.ACTIVE);
            OrganizationEntity supplier = createSupplier();
            List<DiscountBracketEntity> brackets = createBrackets();

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(organizationService.findById(supplierId)).thenReturn(supplier);
            when(bracketEvaluationService.calculateTotalPledged(campaignId)).thenReturn(50);
            when(bracketEvaluationService.getAllBrackets(campaignId)).thenReturn(brackets);

            CampaignPublicResponse result = campaignDiscoveryService.getPublicCampaignDetails(campaignId);

            assertThat(result.id()).isEqualTo(campaignId);
            assertThat(result.title()).isEqualTo("Test Campaign");
            assertThat(result.supplierName()).isEqualTo("Test Supplier");
            assertThat(result.totalPledged()).isEqualTo(50);
            assertThat(result.brackets()).hasSize(3);
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign not found")
        void shouldThrowExceptionWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignDiscoveryService.getPublicCampaignDetails(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining("Campaign not found");
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign is not active")
        void shouldThrowExceptionWhenCampaignNotActive() {
            CampaignEntity campaign = createCampaign(CampaignStatus.DRAFT);
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));

            assertThatThrownBy(() -> campaignDiscoveryService.getPublicCampaignDetails(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class)
                    .hasMessageContaining("not available for public viewing");
        }
    }

    @Nested
    @DisplayName("getBracketProgress")
    class GetBracketProgress {

        @Test
        @DisplayName("should return bracket progress information")
        void shouldReturnBracketProgressInformation() {
            CampaignEntity campaign = createCampaign(CampaignStatus.ACTIVE);
            List<DiscountBracketEntity> brackets = createBrackets();

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(bracketEvaluationService.calculateTotalPledged(campaignId)).thenReturn(25);
            when(bracketEvaluationService.getCurrentBracket(campaignId))
                    .thenReturn(Optional.of(brackets.get(0)));
            when(bracketEvaluationService.getNextBracket(campaignId))
                    .thenReturn(Optional.of(brackets.get(1)));

            BracketProgressResponse result = campaignDiscoveryService.getBracketProgress(campaignId);

            assertThat(result.campaignId()).isEqualTo(campaignId);
            assertThat(result.totalPledged()).isEqualTo(25);
            assertThat(result.currentBracket()).isNotNull();
            assertThat(result.nextBracket()).isNotNull();
            assertThat(result.percentageToNextTier()).isNotNull();
        }

        @Test
        @DisplayName("should return 100% when at highest tier")
        void shouldReturn100PercentWhenAtHighestTier() {
            CampaignEntity campaign = createCampaign(CampaignStatus.ACTIVE);
            List<DiscountBracketEntity> brackets = createBrackets();

            when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
            when(bracketEvaluationService.calculateTotalPledged(campaignId)).thenReturn(150);
            when(bracketEvaluationService.getCurrentBracket(campaignId))
                    .thenReturn(Optional.of(brackets.get(2)));
            when(bracketEvaluationService.getNextBracket(campaignId))
                    .thenReturn(Optional.empty());

            BracketProgressResponse result = campaignDiscoveryService.getBracketProgress(campaignId);

            assertThat(result.nextBracket()).isNull();
            assertThat(result.percentageToNextTier()).isEqualByComparingTo(new BigDecimal("100.00"));
        }

        @Test
        @DisplayName("should throw CampaignNotFoundException when campaign not found")
        void shouldThrowExceptionWhenCampaignNotFound() {
            when(campaignRepository.findById(campaignId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campaignDiscoveryService.getBracketProgress(campaignId))
                    .isInstanceOf(CampaignNotFoundException.class);
        }
    }

    private CampaignEntity createCampaign(CampaignStatus status) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(campaignId);
        campaign.setSupplierId(supplierId);
        campaign.setTitle("Test Campaign");
        campaign.setDescription("Test Description");
        campaign.setProductDetails("{\"color\": \"blue\"}");
        campaign.setDurationDays(30);
        campaign.setStartDate(LocalDate.now());
        campaign.setEndDate(LocalDate.now().plusDays(30));
        campaign.setTargetQty(100);
        campaign.setStatus(status);
        return campaign;
    }

    private OrganizationEntity createSupplier() {
        OrganizationEntity supplier = new OrganizationEntity();
        supplier.setId(supplierId);
        supplier.setNameEn("Test Supplier");
        return supplier;
    }

    private List<DiscountBracketEntity> createBrackets() {
        DiscountBracketEntity bracket1 = new DiscountBracketEntity();
        bracket1.setId(UuidGenerator.generateUuidV7());
        bracket1.setCampaignId(campaignId);
        bracket1.setMinQuantity(0);
        bracket1.setMaxQuantity(49);
        bracket1.setUnitPrice(new BigDecimal("100.00"));
        bracket1.setBracketOrder(0);

        DiscountBracketEntity bracket2 = new DiscountBracketEntity();
        bracket2.setId(UuidGenerator.generateUuidV7());
        bracket2.setCampaignId(campaignId);
        bracket2.setMinQuantity(50);
        bracket2.setMaxQuantity(99);
        bracket2.setUnitPrice(new BigDecimal("90.00"));
        bracket2.setBracketOrder(1);

        DiscountBracketEntity bracket3 = new DiscountBracketEntity();
        bracket3.setId(UuidGenerator.generateUuidV7());
        bracket3.setCampaignId(campaignId);
        bracket3.setMinQuantity(100);
        bracket3.setMaxQuantity(null);
        bracket3.setUnitPrice(new BigDecimal("80.00"));
        bracket3.setBracketOrder(2);

        return List.of(bracket1, bracket2, bracket3);
    }
}
