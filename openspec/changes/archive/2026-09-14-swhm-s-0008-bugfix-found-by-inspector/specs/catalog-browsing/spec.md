# catalog-browsing — delta

## MODIFIED Requirements

### Requirement: Item image association

The system SHALL associate each item with an image location (file path or URL) indicating the product image to display. Where that location serves no image, the item's screen SHALL present a placeholder image rather than a failed one, and SHALL describe it with the same alternative text either way.

#### Scenario: Item image location is retrieved

- **GIVEN** an item with imageLocation="/images/parrots/macaw.jpg"
- **WHEN** the system retrieves the item
- **THEN** the imageLocation SHALL be available for display

#### Scenario: Item detail screen shows a placeholder when the image is unavailable

- **GIVEN** an item whose imageLocation names an asset the application does not serve
- **WHEN** a visitor opens that item's detail screen
- **THEN** an image is rendered whose alternative text is the item's product name, and no failed image is presented
