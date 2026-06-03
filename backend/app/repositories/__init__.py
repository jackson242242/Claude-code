"""Persistence adapters for Phase 2 trip data.

A ``TripRepository`` interface (``base``) has an in-memory implementation used by
default (and in tests) and a PostgreSQL implementation used when DATABASE_URL is
configured. Selection happens in ``registry`` — mirroring the provider adapters.
"""
