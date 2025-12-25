package sa.elm.mashrook.campaigns.domain;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentEntity;
import sa.elm.mashrook.payments.intents.domain.PaymentIntentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PaymentIntentEntity Tests")
class PaymentIntentEntityTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("Field Storage")
    class FieldStorage {

        @Test
        @DisplayName("should store id as UUID")
        void shouldStoreIdAsUuid() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            UUID id = UuidGeneratorUtil.generateUuidV7();

            paymentIntent.setId(id);

            assertThat(paymentIntent.getId()).isEqualTo(id);
        }

        @Test
        @DisplayName("should store campaignId as UUID reference to campaigns")
        void shouldStoreCampaignIdAsUuid() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();

            paymentIntent.setCampaignId(campaignId);

            assertThat(paymentIntent.getCampaignId()).isEqualTo(campaignId);
        }

        @Test
        @DisplayName("should store pledgeId as UUID reference to pledges")
        void shouldStorePledgeIdAsUuid() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();

            paymentIntent.setPledgeId(pledgeId);

            assertThat(paymentIntent.getPledgeId()).isEqualTo(pledgeId);
        }

        @Test
        @DisplayName("should store buyerOrgId as UUID reference to organizations")
        void shouldStoreBuyerOrgIdAsUuid() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            UUID buyerOrgId = UuidGeneratorUtil.generateUuidV7();

            paymentIntent.setBuyerOrgId(buyerOrgId);

            assertThat(paymentIntent.getBuyerOrgId()).isEqualTo(buyerOrgId);
        }

        @Test
        @DisplayName("should store amount as BigDecimal")
        void shouldStoreAmountAsBigDecimal() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            BigDecimal amount = new BigDecimal("1234.5678");

            paymentIntent.setAmount(amount);

            assertThat(paymentIntent.getAmount()).isEqualTo(amount);
        }

        @Test
        @DisplayName("should store status as PaymentIntentStatus enum")
        void shouldStoreStatusAsPaymentIntentStatusEnum() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();

            paymentIntent.setStatus(PaymentIntentStatus.PROCESSING);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.PROCESSING);
        }

        @Test
        @DisplayName("should store retryCount as Integer")
        void shouldStoreRetryCountAsInteger() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();

            paymentIntent.setRetryCount(2);

            assertThat(paymentIntent.getRetryCount()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("Default Values")
    class DefaultValues {

        @Test
        @DisplayName("should default status to PENDING")
        void shouldDefaultStatusToPending() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.PENDING);
        }

        @Test
        @DisplayName("should default retryCount to 0")
        void shouldDefaultRetryCountToZero() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();

            assertThat(paymentIntent.getRetryCount()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Lifecycle Callbacks")
    class LifecycleCallbacks {

        @Test
        @DisplayName("should set createdAt on onCreate")
        void shouldSetCreatedAtOnCreate() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            LocalDateTime beforeCreate = LocalDateTime.now().minusSeconds(1);

            paymentIntent.onCreate();

            assertThat(paymentIntent.getCreatedAt()).isNotNull();
            assertThat(paymentIntent.getCreatedAt()).isAfter(beforeCreate);
        }

        @Test
        @DisplayName("should set updatedAt on onUpdate")
        void shouldSetUpdatedAtOnUpdate() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            LocalDateTime beforeUpdate = LocalDateTime.now().minusSeconds(1);

            paymentIntent.onUpdate();

            assertThat(paymentIntent.getUpdatedAt()).isNotNull();
            assertThat(paymentIntent.getUpdatedAt()).isAfter(beforeUpdate);
        }
    }

    @Nested
    @DisplayName("Timestamp Fields")
    class TimestampFields {

        @Test
        @DisplayName("should store createdAt as LocalDateTime")
        void shouldStoreCreatedAtAsLocalDateTime() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            LocalDateTime createdAt = LocalDateTime.of(2025, 1, 10, 10, 30, 0);

            paymentIntent.setCreatedAt(createdAt);

            assertThat(paymentIntent.getCreatedAt()).isEqualTo(createdAt);
        }

        @Test
        @DisplayName("should store updatedAt as LocalDateTime")
        void shouldStoreUpdatedAtAsLocalDateTime() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            LocalDateTime updatedAt = LocalDateTime.of(2025, 1, 15, 14, 45, 0);

            paymentIntent.setUpdatedAt(updatedAt);

            assertThat(paymentIntent.getUpdatedAt()).isEqualTo(updatedAt);
        }
    }

    @Nested
    @DisplayName("Validation - Amount")
    class AmountValidation {

        @Test
        @DisplayName("should pass validation when amount is greater than 0")
        void shouldPassValidationWhenAmountIsGreaterThanZero() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setAmount(new BigDecimal("100.00"));

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should fail validation when amount is zero")
        void shouldFailValidationWhenAmountIsZero() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setAmount(BigDecimal.ZERO);

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).hasSize(1);
            assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("amount");
        }

        @Test
        @DisplayName("should fail validation when amount is negative")
        void shouldFailValidationWhenAmountIsNegative() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setAmount(new BigDecimal("-100.00"));

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).hasSize(1);
            assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("amount");
        }

        @Test
        @DisplayName("should pass validation for very small positive amount")
        void shouldPassValidationForVerySmallPositiveAmount() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setAmount(new BigDecimal("0.0001"));

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("Validation - RetryCount")
    class RetryCountValidation {

        @Test
        @DisplayName("should pass validation when retryCount is 0")
        void shouldPassValidationWhenRetryCountIsZero() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setRetryCount(0);

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should pass validation when retryCount is 3")
        void shouldPassValidationWhenRetryCountIsThree() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setRetryCount(3);

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("should fail validation when retryCount is greater than 3")
        void shouldFailValidationWhenRetryCountIsGreaterThanThree() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setRetryCount(4);

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).hasSize(1);
            assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("retryCount");
        }

        @Test
        @DisplayName("should fail validation when retryCount is negative")
        void shouldFailValidationWhenRetryCountIsNegative() {
            PaymentIntentEntity paymentIntent = createValidPaymentIntent();
            paymentIntent.setRetryCount(-1);

            Set<ConstraintViolation<PaymentIntentEntity>> violations = validator.validate(paymentIntent);

            assertThat(violations).hasSize(1);
            assertThat(violations.iterator().next().getPropertyPath().toString()).isEqualTo("retryCount");
        }
    }

    @Nested
    @DisplayName("Complete PaymentIntent Creation")
    class CompletePaymentIntentCreation {

        @Test
        @DisplayName("should create payment intent with all fields populated")
        void shouldCreatePaymentIntentWithAllFieldsPopulated() {
            UUID id = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId = UuidGeneratorUtil.generateUuidV7();
            UUID pledgeId = UuidGeneratorUtil.generateUuidV7();
            UUID buyerOrgId = UuidGeneratorUtil.generateUuidV7();
            BigDecimal amount = new BigDecimal("9999.9999");
            PaymentIntentStatus status = PaymentIntentStatus.SUCCEEDED;
            Integer retryCount = 1;
            LocalDateTime createdAt = LocalDateTime.now();

            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setId(id);
            paymentIntent.setCampaignId(campaignId);
            paymentIntent.setPledgeId(pledgeId);
            paymentIntent.setBuyerOrgId(buyerOrgId);
            paymentIntent.setAmount(amount);
            paymentIntent.setStatus(status);
            paymentIntent.setRetryCount(retryCount);
            paymentIntent.setCreatedAt(createdAt);

            assertThat(paymentIntent.getId()).isEqualTo(id);
            assertThat(paymentIntent.getCampaignId()).isEqualTo(campaignId);
            assertThat(paymentIntent.getPledgeId()).isEqualTo(pledgeId);
            assertThat(paymentIntent.getBuyerOrgId()).isEqualTo(buyerOrgId);
            assertThat(paymentIntent.getAmount()).isEqualTo(amount);
            assertThat(paymentIntent.getStatus()).isEqualTo(status);
            assertThat(paymentIntent.getRetryCount()).isEqualTo(retryCount);
            assertThat(paymentIntent.getCreatedAt()).isEqualTo(createdAt);
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitions {

        @Test
        @DisplayName("should allow transition from PENDING to PROCESSING")
        void shouldAllowTransitionFromPendingToProcessing() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.PENDING);

            paymentIntent.setStatus(PaymentIntentStatus.PROCESSING);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.PROCESSING);
        }

        @Test
        @DisplayName("should allow transition from PROCESSING to SUCCEEDED")
        void shouldAllowTransitionFromProcessingToSucceeded() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setStatus(PaymentIntentStatus.PROCESSING);

            paymentIntent.setStatus(PaymentIntentStatus.SUCCEEDED);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.SUCCEEDED);
        }

        @Test
        @DisplayName("should allow transition from PROCESSING to FAILED_RETRY_1")
        void shouldAllowTransitionFromProcessingToFailedRetry1() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setStatus(PaymentIntentStatus.PROCESSING);

            paymentIntent.setStatus(PaymentIntentStatus.FAILED_RETRY_1);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_1);
        }

        @Test
        @DisplayName("should allow transition through retry sequence")
        void shouldAllowTransitionThroughRetrySequence() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();

            paymentIntent.setStatus(PaymentIntentStatus.FAILED_RETRY_1);
            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_1);

            paymentIntent.setStatus(PaymentIntentStatus.FAILED_RETRY_2);
            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_2);

            paymentIntent.setStatus(PaymentIntentStatus.FAILED_RETRY_3);
            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.FAILED_RETRY_3);
        }

        @Test
        @DisplayName("should allow transition to SENT_TO_AR after all retries failed")
        void shouldAllowTransitionToSentToArAfterAllRetriesFailed() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setStatus(PaymentIntentStatus.FAILED_RETRY_3);

            paymentIntent.setStatus(PaymentIntentStatus.SENT_TO_AR);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.SENT_TO_AR);
        }

        @Test
        @DisplayName("should allow transition from SENT_TO_AR to COLLECTED_VIA_AR")
        void shouldAllowTransitionFromSentToArToCollectedViaAr() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setStatus(PaymentIntentStatus.SENT_TO_AR);

            paymentIntent.setStatus(PaymentIntentStatus.COLLECTED_VIA_AR);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.COLLECTED_VIA_AR);
        }

        @Test
        @DisplayName("should allow transition from SENT_TO_AR to WRITTEN_OFF")
        void shouldAllowTransitionFromSentToArToWrittenOff() {
            PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
            paymentIntent.setStatus(PaymentIntentStatus.SENT_TO_AR);

            paymentIntent.setStatus(PaymentIntentStatus.WRITTEN_OFF);

            assertThat(paymentIntent.getStatus()).isEqualTo(PaymentIntentStatus.WRITTEN_OFF);
        }
    }

    private PaymentIntentEntity createValidPaymentIntent() {
        PaymentIntentEntity paymentIntent = new PaymentIntentEntity();
        paymentIntent.setCampaignId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setPledgeId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setBuyerOrgId(UuidGeneratorUtil.generateUuidV7());
        paymentIntent.setAmount(new BigDecimal("100.00"));
        paymentIntent.setRetryCount(0);
        return paymentIntent;
    }
}
