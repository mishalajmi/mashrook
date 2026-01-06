package sa.elm.mashrook.invoices.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("InvoiceEntity Tests")
class InvoiceEntityTest {

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            InvoiceEntity invoice = new InvoiceEntity();
            UUID id = UuidGeneratorUtil.generateUuidV7();

            invoice.setId(id);

            assertThat(invoice.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store campaign as CampaignEntity reference")
        void shouldStoreCampaignAsEntity() {
            InvoiceEntity invoice = new InvoiceEntity();
            CampaignEntity campaign = new CampaignEntity();
            campaign.setId(UuidGeneratorUtil.generateUuidV7());

            invoice.setCampaign(campaign);

            assertThat(invoice.getCampaign()).isEqualTo(campaign);
        }

        @Test
        @DisplayName("should store pledge as PledgeEntity reference")
        void shouldStorePledgeAsEntity() {
            InvoiceEntity invoice = new InvoiceEntity();
            PledgeEntity pledge = new PledgeEntity();
            pledge.setId(UuidGeneratorUtil.generateUuidV7());

            invoice.setPledge(pledge);

            assertThat(invoice.getPledge()).isEqualTo(pledge);
        }

        @Test
        @DisplayName("should store organization as OrganizationEntity reference")
        void shouldStoreOrganizationAsEntity() {
            InvoiceEntity invoice = new InvoiceEntity();
            OrganizationEntity organization = new OrganizationEntity();
            organization.setId(UuidGeneratorUtil.generateUuidV7());

            invoice.setOrganization(organization);

            assertThat(invoice.getOrganization()).isEqualTo(organization);
        }

        @Test
        @DisplayName("should store invoiceNumber as String")
        void shouldStoreInvoiceNumberAsString() {
            InvoiceEntity invoice = new InvoiceEntity();
            String invoiceNumber = "INV-202501-0001";

            invoice.setInvoiceNumber(invoiceNumber);

            assertThat(invoice.getInvoiceNumber()).isEqualTo(invoiceNumber);
        }

        @Test
        @DisplayName("should store subtotal as BigDecimal")
        void shouldStoreSubtotalAsBigDecimal() {
            InvoiceEntity invoice = new InvoiceEntity();
            BigDecimal subtotal = new BigDecimal("1000.00");

            invoice.setSubtotal(subtotal);

            assertThat(invoice.getSubtotal()).isEqualTo(subtotal);
        }

        @Test
        @DisplayName("should store taxAmount as BigDecimal")
        void shouldStoreTaxAmountAsBigDecimal() {
            InvoiceEntity invoice = new InvoiceEntity();
            BigDecimal taxAmount = new BigDecimal("150.00");

            invoice.setTaxAmount(taxAmount);

            assertThat(invoice.getTaxAmount()).isEqualTo(taxAmount);
        }

        @Test
        @DisplayName("should store totalAmount as BigDecimal")
        void shouldStoreTotalAmountAsBigDecimal() {
            InvoiceEntity invoice = new InvoiceEntity();
            BigDecimal totalAmount = new BigDecimal("1150.00");

            invoice.setTotalAmount(totalAmount);

            assertThat(invoice.getTotalAmount()).isEqualTo(totalAmount);
        }

        @Test
        @DisplayName("should store status as InvoiceStatus enum")
        void shouldStoreStatusAsInvoiceStatusEnum() {
            InvoiceEntity invoice = new InvoiceEntity();

            invoice.setStatus(InvoiceStatus.SENT);

            assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.SENT);
        }

        @Test
        @DisplayName("should store dueDate as LocalDate")
        void shouldStoreDueDateAsLocalDate() {
            InvoiceEntity invoice = new InvoiceEntity();
            LocalDate dueDate = LocalDate.of(2025, 2, 14);

            invoice.setDueDate(dueDate);

            assertThat(invoice.getDueDate()).isEqualTo(dueDate);
        }

        @Test
        @DisplayName("should store notes as nullable String")
        void shouldStoreNotesAsNullableString() {
            InvoiceEntity invoice = new InvoiceEntity();
            String notes = "Payment for bulk order";

            invoice.setNotes(notes);

            assertThat(invoice.getNotes()).isEqualTo(notes);
        }
    }

    @Nested
    @DisplayName("Default Values")
    class DefaultValues {

        @Test
        @DisplayName("should default status to DRAFT")
        void shouldDefaultStatusToDraft() {
            InvoiceEntity invoice = new InvoiceEntity();

            assertThat(invoice.getStatus()).isEqualTo(InvoiceStatus.DRAFT);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            InvoiceEntity invoice = new InvoiceEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            invoice.onCreate();

            assertThat(invoice.getCreatedAt()).isNotNull();
            assertThat(invoice.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            InvoiceEntity invoice = new InvoiceEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            invoice.onUpdate();

            assertThat(invoice.getUpdatedAt()).isNotNull();
            assertThat(invoice.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Complete Invoice Creation")
    class CompleteInvoiceCreation {

        @Test
        @DisplayName("should create invoice with all fields populated")
        void shouldCreateInvoiceWithAllFieldsPopulated() {
            UUID id = UuidGeneratorUtil.generateUuidV7();
            CampaignEntity campaign = new CampaignEntity();
            campaign.setId(UuidGeneratorUtil.generateUuidV7());
            PledgeEntity pledge = new PledgeEntity();
            pledge.setId(UuidGeneratorUtil.generateUuidV7());
            OrganizationEntity organization = new OrganizationEntity();
            organization.setId(UuidGeneratorUtil.generateUuidV7());
            String invoiceNumber = "INV-202501-0042";
            BigDecimal subtotal = new BigDecimal("5000.00");
            BigDecimal taxAmount = new BigDecimal("750.00");
            BigDecimal totalAmount = new BigDecimal("5750.00");
            InvoiceStatus status = InvoiceStatus.SENT;
            LocalDate dueDate = LocalDate.of(2025, 2, 14);
            String notes = "Bulk laptop purchase";

            InvoiceEntity invoice = new InvoiceEntity();
            invoice.setId(id);
            invoice.setCampaign(campaign);
            invoice.setPledge(pledge);
            invoice.setOrganization(organization);
            invoice.setInvoiceNumber(invoiceNumber);
            invoice.setSubtotal(subtotal);
            invoice.setTaxAmount(taxAmount);
            invoice.setTotalAmount(totalAmount);
            invoice.setStatus(status);
            invoice.setDueDate(dueDate);
            invoice.setNotes(notes);

            assertThat(invoice.getId()).isEqualTo(id);
            assertThat(invoice.getCampaign()).isEqualTo(campaign);
            assertThat(invoice.getPledge()).isEqualTo(pledge);
            assertThat(invoice.getOrganization()).isEqualTo(organization);
            assertThat(invoice.getInvoiceNumber()).isEqualTo(invoiceNumber);
            assertThat(invoice.getSubtotal()).isEqualTo(subtotal);
            assertThat(invoice.getTaxAmount()).isEqualTo(taxAmount);
            assertThat(invoice.getTotalAmount()).isEqualTo(totalAmount);
            assertThat(invoice.getStatus()).isEqualTo(status);
            assertThat(invoice.getDueDate()).isEqualTo(dueDate);
            assertThat(invoice.getNotes()).isEqualTo(notes);
        }
    }
}
