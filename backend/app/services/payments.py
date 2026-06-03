"""Pluggable payment gateway.

Default is the affiliate / no-charge model: a booking is "reserved" and the
user completes purchases via the per-line deep links. Setting
PAYMENT_GATEWAY=stripe with a key swaps in a charge step that marks bookings
"paid" (a real PaymentIntent call would live in StripePaymentGateway.charge).
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
        # A real integration would create a Stripe PaymentIntent here.
        return PaymentResult(status="paid", provider="stripe")


def payment_gateway() -> PaymentGateway:
    if settings.payment_gateway == "stripe" and settings.stripe_secret_key:
        return StripePaymentGateway(settings.stripe_secret_key)
    return NoopPaymentGateway()
