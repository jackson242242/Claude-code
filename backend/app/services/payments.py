"""Pluggable payment gateway.

Default is the affiliate / no-charge model: a booking is "reserved" and the
user completes purchases via the per-line deep links. PAYMENT_GATEWAY=stripe
selects the Stripe gateway, which is still a stub: until a real PaymentIntent
call is implemented it also returns "reserved" — a booking must never be
recorded as "paid" when no money actually moved.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.config import settings


@dataclass(frozen=True)
class PaymentResult:
    status: str
    provider: str


class PaymentGateway(ABC):
    @abstractmethod
    def charge(
        self, amount_usd: float, currency: str, description: str
    ) -> PaymentResult:
        raise NotImplementedError


class NoopPaymentGateway(PaymentGateway):
    def charge(
        self, amount_usd: float, currency: str, description: str
    ) -> PaymentResult:
        return PaymentResult(status="reserved", provider="none")


class StripePaymentGateway(PaymentGateway):
    def __init__(self, secret_key: str) -> None:
        self._secret_key = secret_key

    def charge(
        self, amount_usd: float, currency: str, description: str
    ) -> PaymentResult:
        # Stub: a real integration would create a Stripe PaymentIntent here and
        # only report "paid" on a confirmed charge. Until then, stay honest —
        # flipping PAYMENT_GATEWAY=stripe must not fabricate paid bookings.
        return PaymentResult(status="reserved", provider="stripe")


def payment_gateway() -> PaymentGateway:
    if settings.payment_gateway == "stripe" and settings.stripe_secret_key:
        return StripePaymentGateway(settings.stripe_secret_key)
    return NoopPaymentGateway()
