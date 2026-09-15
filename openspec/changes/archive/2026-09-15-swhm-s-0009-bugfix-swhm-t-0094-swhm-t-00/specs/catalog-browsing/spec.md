# catalog-browsing — delta

## MODIFIED Requirements

### Requirement: Item image association

The system SHALL associate each item with an image location (file path or URL) indicating the product image to display, and SHALL serve an image at every location its own catalogue content names. Where a location serves no image, the item's screen SHALL present a placeholder image rather than a failed one, and SHALL describe it with the same alternative text either way.

#### Scenario: Item image location is retrieved

- **GIVEN** an item with imageLocation="/images/parrots/macaw.jpg"
- **WHEN** the system retrieves the item
- **THEN** the imageLocation SHALL be available for display

#### Scenario: Every catalogued item's image location is served

- **GIVEN** the catalogue content the application ships
- **WHEN** each distinct image location named by that content is requested from the application
- **THEN** every one of them is answered with an image, and none is answered as not found

#### Scenario: Item detail screen shows the item's own image

- **GIVEN** a visitor opening the detail screen of a catalogued item
- **WHEN** the screen's product image has finished loading
- **THEN** the image displayed is the one the item's image location names, not the shared placeholder, and no image request the screen made was answered as not found

#### Scenario: Item detail screen shows a placeholder when the image is unavailable

- **GIVEN** an item whose imageLocation names an asset the application does not serve
- **WHEN** a visitor opens that item's detail screen
- **THEN** an image is rendered whose alternative text is the item's product name, and no failed image is presented
