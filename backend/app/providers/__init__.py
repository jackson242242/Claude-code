"""Provider adapters for the bookable verticals (flights, hotels, transport).

Each vertical defines an abstract interface in ``base`` with a mock
implementation today; real integrations (e.g. Duffel/Amadeus, hotel APIs,
Rome2Rio/transit) can register under the same interface with no route changes.
"""
